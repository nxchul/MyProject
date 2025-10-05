/**
 * Query Analyzer - Classifies user queries to determine optimal LLM routing
 */

import { TaskType, QueryContext } from '../mcp-interface';

interface QueryFeatures {
  hasCodeKeywords: boolean;
  hasCreativeKeywords: boolean;
  hasMathKeywords: boolean;
  hasTechnicalKeywords: boolean;
  hasTranslationKeywords: boolean;
  length: number;
  questionType: 'what' | 'how' | 'why' | 'when' | 'where' | 'explain' | 'create' | 'other';
}

export class QueryAnalyzer {
  private static codeKeywords = [
    'code', 'function', 'variable', 'class', 'method', 'algorithm', 'programming',
    'javascript', 'typescript', 'python', 'java', 'react', 'nextjs', 'api',
    'database', 'sql', 'debug', 'error', 'syntax', 'implement', 'refactor'
  ];

  private static creativeKeywords = [
    'write', 'story', 'poem', 'creative', 'imagine', 'describe', 'narrative',
    'character', 'plot', 'dialogue', 'essay', 'article', 'blog', 'content'
  ];

  private static mathKeywords = [
    'calculate', 'equation', 'formula', 'mathematics', 'math', 'solve',
    'statistics', 'probability', 'geometry', 'algebra', 'calculus', 'number'
  ];

  private static technicalKeywords = [
    'analyze', 'technical', 'architecture', 'system', 'design', 'specification',
    'performance', 'optimization', 'scalability', 'security', 'protocol',
    'semiconductor', 'tsmc', 'wafer', 'pdk', 'gds', 'layout'
  ];

  private static translationKeywords = [
    'translate', 'translation', '번역', '한국어', 'korean', 'english',
    'language', 'convert', 'korean to english', 'english to korean'
  ];

  static analyzeQuery(query: string): QueryContext {
    const features = this.extractFeatures(query);
    const taskType = this.classifyTaskType(features, query);
    const complexity = this.determineComplexity(features, query);
    const domain = this.determineDomain(query);

    return {
      taskType,
      complexity,
      domain
    };
  }

  private static extractFeatures(query: string): QueryFeatures {
    const lowercaseQuery = query.toLowerCase();
    
    return {
      hasCodeKeywords: this.codeKeywords.some(keyword => 
        lowercaseQuery.includes(keyword)
      ),
      hasCreativeKeywords: this.creativeKeywords.some(keyword => 
        lowercaseQuery.includes(keyword)
      ),
      hasMathKeywords: this.mathKeywords.some(keyword => 
        lowercaseQuery.includes(keyword)
      ),
      hasTechnicalKeywords: this.technicalKeywords.some(keyword => 
        lowercaseQuery.includes(keyword)
      ),
      hasTranslationKeywords: this.translationKeywords.some(keyword => 
        lowercaseQuery.includes(keyword)
      ),
      length: query.length,
      questionType: this.detectQuestionType(lowercaseQuery)
    };
  }

  private static classifyTaskType(features: QueryFeatures, query: string): TaskType {
    // Priority-based classification
    if (features.hasTranslationKeywords) {
      return TaskType.TRANSLATION;
    }
    
    if (features.hasCodeKeywords) {
      return TaskType.CODE_GENERATION;
    }
    
    if (features.hasMathKeywords) {
      return TaskType.MATH_REASONING;
    }
    
    if (features.hasCreativeKeywords) {
      return TaskType.CREATIVE_WRITING;
    }
    
    if (features.hasTechnicalKeywords) {
      return TaskType.TECHNICAL_ANALYSIS;
    }
    
    // Check for summarization indicators
    if (query.toLowerCase().includes('summarize') || 
        query.toLowerCase().includes('summary') ||
        query.toLowerCase().includes('요약')) {
      return TaskType.SUMMARIZATION;
    }
    
    return TaskType.GENERAL_QA;
  }

  private static determineComplexity(features: QueryFeatures, query: string): 'simple' | 'medium' | 'complex' {
    let complexityScore = 0;
    
    // Length-based scoring
    if (features.length > 200) complexityScore += 2;
    else if (features.length > 100) complexityScore += 1;
    
    // Multiple domain indicators suggest complexity
    const domainCount = [
      features.hasCodeKeywords,
      features.hasCreativeKeywords, 
      features.hasMathKeywords,
      features.hasTechnicalKeywords
    ].filter(Boolean).length;
    
    complexityScore += domainCount;
    
    // Question type complexity
    if (features.questionType === 'why' || features.questionType === 'explain') {
      complexityScore += 1;
    }
    
    // Multi-step indicators
    if (query.includes(' and ') || query.includes(' then ') || 
        query.includes('step') || query.includes('process')) {
      complexityScore += 1;
    }
    
    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'medium';
    return 'simple';
  }

  private static determineDomain(query: string): string {
    const lowercaseQuery = query.toLowerCase();
    
    if (this.technicalKeywords.some(k => lowercaseQuery.includes(k))) {
      return 'semiconductor';
    }
    if (this.codeKeywords.some(k => lowercaseQuery.includes(k))) {
      return 'software';
    }
    if (this.mathKeywords.some(k => lowercaseQuery.includes(k))) {
      return 'mathematics';
    }
    if (this.creativeKeywords.some(k => lowercaseQuery.includes(k))) {
      return 'creative';
    }
    
    return 'general';
  }

  private static detectQuestionType(query: string): QueryFeatures['questionType'] {
    if (query.startsWith('what') || query.includes('무엇')) return 'what';
    if (query.startsWith('how') || query.includes('어떻게')) return 'how';
    if (query.startsWith('why') || query.includes('왜')) return 'why';
    if (query.startsWith('when') || query.includes('언제')) return 'when';
    if (query.startsWith('where') || query.includes('어디')) return 'where';
    if (query.includes('explain') || query.includes('설명')) return 'explain';
    if (query.includes('create') || query.includes('make') || query.includes('생성')) return 'create';
    
    return 'other';
  }
}