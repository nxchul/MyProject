// @ts-nocheck
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase env vars");
}
const supabase = createClient(supabaseUrl, serviceKey);

async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST) return; // skip if not configured
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}

async function processApplications() {
  const { data: apps, error } = await supabase
    .from("mpw_applications")
    .select("id, user_id, gds_path, status, shuttle:mpw_shuttles(process)")
    .eq("status", "GDS_UPLOADED");
  if (error) throw error;
  console.log(`Found ${apps.length} applications to process`);

  for (const app of apps) {
    try {
      console.log(`Processing application ${app.id}`);
      const { data: signed } = await supabase.storage
        .from("gds")
        .createSignedUrl(app.gds_path, 60);
      if (!signed?.signedUrl) throw new Error("Signed URL error");
      const tmpDir = fs.mkdtempSync("/tmp/gds-");
      const localPath = path.join(tmpDir, path.basename(app.gds_path));
      const res = await fetch(signed.signedUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(localPath, buffer);

      // XOR verification stub (replace with real klayout command)
      let xorPassed = true;
      let summary = "XOR passed (stub)";
      try {
        // execSync(`klayout -b -r xor_run.lyt -rd IN_FILE=${localPath}`, { stdio: "inherit" });
        xorPassed = true;
      } catch (err) {
        xorPassed = false;
        summary = "XOR differences detected";
      }

      // Upload summary as text file
      const reportPath = `${app.user_id}/${app.id}-xor.txt`;
      await supabase.storage
        .from("xor")
        .upload(reportPath, summary, { contentType: "text/plain", upsert: true });

      const newStatus = xorPassed ? "XOR_PASSED" : "XOR_FAILED";
      await supabase
        .from("mpw_applications")
        .update({ status: newStatus, xor_report_path: reportPath, xor_summary: summary })
        .eq("id", app.id);

      const { data: userRes } = await supabase.auth.admin.getUserById(app.user_id);
      if (userRes?.user?.email) {
        await sendEmail(
          userRes.user.email,
          `MPW Application ${newStatus}`,
          `Your MPW application for ${app.shuttle.process} is now ${newStatus}.\nSummary: ${summary}`
        );
      }
    } catch (err) {
      console.error(`Application ${app.id} failed`, err);
    }
  }
}

processApplications().then(() => console.log("Worker finished"));