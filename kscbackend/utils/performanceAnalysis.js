// utils/performanceAnalysis.js
// Enhanced Performance Analysis System for Student Results

/**
 * Calculate the overall trend from multiple results
 * @param {Array} results - Array of results sorted chronologically (oldest first)
 * @returns {string} - 'improving', 'declining', 'stable', 'fluctuating', 'first-term'
 */
export function calculateOverallTrend(results) {
  if (!results || results.length === 0) return 'first-term';
  if (results.length === 1) return 'first-term';
  
  const averages = results.map(r => r.averageMarks || 0);
  const changes = [];
  
  for (let i = 1; i < averages.length; i++) {
    changes.push(averages[i] - averages[i - 1]);
  }
  
  const positiveChanges = changes.filter(c => c > 2).length;
  const negativeChanges = changes.filter(c => c < -2).length;
  const stableChanges = changes.filter(c => Math.abs(c) <= 2).length;
  
  const totalChanges = changes.length;
  
  if (positiveChanges / totalChanges >= 0.6) return 'improving';
  if (negativeChanges / totalChanges >= 0.6) return 'declining';
  if (stableChanges / totalChanges >= 0.6) return 'stable';
  return 'fluctuating';
}

/**
 * Find the best and worst terms
 * @param {Array} results - Array of results
 * @returns {Object} - { bestTerm, worstTerm }
 */
export function findExtremeTerms(results) {
  if (!results || results.length === 0) return { bestTerm: null, worstTerm: null };
  
  let best = results[0];
  let worst = results[0];
  
  results.forEach(r => {
    if ((r.averageMarks || 0) > (best.averageMarks || 0)) best = r;
    if ((r.averageMarks || 0) < (worst.averageMarks || 0)) worst = r;
  });
  
  return {
    bestTerm: { term: best.term, year: best.year, average: best.averageMarks },
    worstTerm: { term: worst.term, year: worst.year, average: worst.averageMarks }
  };
}

/**
 * Analyze subject trends over time
 * @param {Array} results - Array of results sorted chronologically
 * @returns {Array} - Subject analysis array
 */
export function analyzeSubjectTrends(results) {
  if (!results || results.length === 0) return [];
  
  // Collect all subjects across all results
  const subjectData = {};
  
  results.forEach(result => {
    if (!result.subjects) return;
    result.subjects.forEach(subject => {
      const name = subject.subjectName;
      if (!subjectData[name]) {
        subjectData[name] = [];
      }
      subjectData[name].push({
        term: result.term,
        year: result.year,
        marks: subject.marks,
        grade: subject.grade
      });
    });
  });
  
  // Analyze each subject
  const subjectAnalysis = [];
  
  Object.entries(subjectData).forEach(([subjectName, data]) => {
    const marks = data.map(d => d.marks);
    const avgMark = marks.reduce((a, b) => a + b, 0) / marks.length;
    const bestMark = Math.max(...marks);
    const worstMark = Math.min(...marks);
    
    // Calculate consistency (inverse of standard deviation, normalized to 0-100)
    const variance = marks.reduce((sum, m) => sum + Math.pow(m - avgMark, 2), 0) / marks.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, Math.min(100, 100 - (stdDev * 2)));
    
    // Calculate trend
    let trend = 'stable';
    if (marks.length >= 2) {
      const firstHalf = marks.slice(0, Math.floor(marks.length / 2));
      const secondHalf = marks.slice(Math.floor(marks.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (secondAvg - firstAvg > 5) trend = 'improving';
      else if (firstAvg - secondAvg > 5) trend = 'declining';
      else if (stdDev > 15) trend = 'fluctuating';
    }
    
    // Change from previous
    const changeFromPrevious = marks.length >= 2 
      ? marks[marks.length - 1] - marks[marks.length - 2]
      : null;
    
    subjectAnalysis.push({
      subjectName,
      trend,
      averageOverTime: Math.round(avgMark * 10) / 10,
      bestMark,
      worstMark,
      consistency: Math.round(consistency),
      changeFromPrevious
    });
  });
  
  return subjectAnalysis;
}

/**
 * Find consistently weak/strong subjects (across 3+ terms)
 * @param {Array} results - Array of results
 * @returns {Object} - { consistentlyWeak, consistentlyStrong, improved, declined }
 */
export function findConsistentSubjects(results) {
  if (!results || results.length < 2) {
    return {
      consistentlyWeak: [],
      consistentlyStrong: [],
      improved: [],
      declined: []
    };
  }
  
  const subjectPerformance = {};
  
  results.forEach(result => {
    if (!result.subjects) return;
    const studentAvg = result.averageMarks || 0;
    
    result.subjects.forEach(subject => {
      const name = subject.subjectName;
      if (!subjectPerformance[name]) {
        subjectPerformance[name] = {
          belowAvg: 0,
          aboveAvg: 0,
          highPerformance: 0,
          totalTerms: 0,
          firstMark: null,
          lastMark: null
        };
      }
      
      if (subjectPerformance[name].firstMark === null) {
        subjectPerformance[name].firstMark = subject.marks;
      }
      subjectPerformance[name].lastMark = subject.marks;
      subjectPerformance[name].totalTerms++;
      
      if (subject.marks < studentAvg - 5) {
        subjectPerformance[name].belowAvg++;
      } else if (subject.marks > studentAvg + 10) {
        subjectPerformance[name].highPerformance++;
      }
      
      if (subject.marks > studentAvg) {
        subjectPerformance[name].aboveAvg++;
      }
    });
  });
  
  const consistentlyWeak = [];
  const consistentlyStrong = [];
  const improved = [];
  const declined = [];
  
  Object.entries(subjectPerformance).forEach(([subject, perf]) => {
    const threshold = Math.max(2, perf.totalTerms * 0.6);
    
    if (perf.belowAvg >= threshold) {
      consistentlyWeak.push(subject);
    }
    if (perf.highPerformance >= threshold || perf.aboveAvg >= threshold) {
      consistentlyStrong.push(subject);
    }
    
    // Check for significant improvement or decline
    if (perf.firstMark !== null && perf.lastMark !== null) {
      const change = perf.lastMark - perf.firstMark;
      if (change >= 10) improved.push(subject);
      if (change <= -10) declined.push(subject);
    }
  });
  
  return { consistentlyWeak, consistentlyStrong, improved, declined };
}

/**
 * Predict next term's average based on historical data
 * @param {Array} results - Array of results sorted chronologically
 * @returns {number|null} - Predicted average or null if insufficient data
 */
export function predictNextTermAverage(results) {
  if (!results || results.length < 2) return null;
  
  const averages = results.map(r => r.averageMarks || 0);
  
  // Simple linear regression
  const n = averages.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = averages.reduce((a, b) => a + b, 0);
  const sumXY = averages.reduce((sum, y, i) => sum + (i + 1) * y, 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict next term (x = n + 1)
  let prediction = slope * (n + 1) + intercept;
  
  // Bound the prediction between 0 and 100
  prediction = Math.max(0, Math.min(100, prediction));
  
  return Math.round(prediction * 10) / 10;
}

/**
 * Assess risk level based on performance data
 * @param {Array} results - Array of results
 * @param {Object} currentResult - Current result being analyzed
 * @returns {Object} - { riskLevel, riskFactors }
 */
export function assessRisk(results, currentResult) {
  const riskFactors = [];
  let riskScore = 0;
  
  if (!currentResult) return { riskLevel: '', riskFactors: [] };
  
  const avg = currentResult.averageMarks || 0;
  
  // Factor 1: Current average
  if (avg < 40) {
    riskFactors.push('Current average is critically low (below 40%)');
    riskScore += 3;
  } else if (avg < 50) {
    riskFactors.push('Current average is below passing threshold');
    riskScore += 2;
  }
  
  // Factor 2: Declining trend
  if (results && results.length >= 2) {
    const prevAvg = results[results.length - 2].averageMarks || 0;
    if (avg < prevAvg - 10) {
      riskFactors.push(`Significant decline from previous term (${(prevAvg - avg).toFixed(1)}% drop)`);
      riskScore += 2;
    } else if (avg < prevAvg - 5) {
      riskFactors.push('Moderate decline from previous term');
      riskScore += 1;
    }
  }
  
  // Factor 3: Attendance issues
  if (currentResult.attendance) {
    const absentRate = currentResult.attendance.daysAbsent / (currentResult.attendance.totalDays || 1);
    if (absentRate > 0.2) {
      riskFactors.push('High absence rate (>20% days missed)');
      riskScore += 2;
    } else if (absentRate > 0.1) {
      riskFactors.push('Moderate absence rate (>10% days missed)');
      riskScore += 1;
    }
  }
  
  // Factor 4: Multiple failing subjects
  if (currentResult.subjects) {
    const failingSubjects = currentResult.subjects.filter(s => s.marks < 40).length;
    if (failingSubjects >= 3) {
      riskFactors.push(`Failing in ${failingSubjects} subjects`);
      riskScore += 2;
    } else if (failingSubjects >= 1) {
      riskFactors.push(`Failing in ${failingSubjects} subject(s)`);
      riskScore += 1;
    }
  }
  
  // Factor 5: Consistent decline over 3+ terms
  if (results && results.length >= 3) {
    const recent3 = results.slice(-3).map(r => r.averageMarks || 0);
    if (recent3[0] > recent3[1] && recent3[1] > recent3[2]) {
      riskFactors.push('Consistent decline over last 3 terms');
      riskScore += 2;
    }
  }
  
  // Determine risk level
  let riskLevel = 'low';
  if (riskScore >= 5) riskLevel = 'high';
  else if (riskScore >= 3) riskLevel = 'medium';
  
  return { riskLevel, riskFactors };
}

/**
 * Analyze first result for students with no history
 * @param {Object} result - The first/only result
 * @param {Object} classData - Optional class comparison data
 * @returns {Object} - First result analysis
 */
export function analyzeFirstResult(result, classData = null) {
  if (!result || !result.subjects || result.subjects.length === 0) {
    return {
      isFirstResult: true,
      strongestSubject: null,
      weakestSubject: null,
      subjectSpread: 0,
      balanceScore: 0,
      subjectsAbove70: [],
      subjectsBelow50: []
    };
  }
  
  const subjects = result.subjects;
  const marks = subjects.map(s => s.marks);
  const avg = result.averageMarks || (marks.reduce((a, b) => a + b, 0) / marks.length);
  
  // Find strongest and weakest
  const sortedSubjects = [...subjects].sort((a, b) => b.marks - a.marks);
  const strongestSubject = sortedSubjects[0]?.subjectName;
  const weakestSubject = sortedSubjects[sortedSubjects.length - 1]?.subjectName;
  
  // Calculate spread and balance
  const maxMark = Math.max(...marks);
  const minMark = Math.min(...marks);
  const subjectSpread = maxMark - minMark;
  
  // Balance score: How evenly distributed (inverse of variance)
  const variance = marks.reduce((sum, m) => sum + Math.pow(m - avg, 2), 0) / marks.length;
  const balanceScore = Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) * 2)));
  
  // Subjects above/below thresholds
  const subjectsAbove70 = subjects.filter(s => s.marks >= 70).map(s => s.subjectName);
  const subjectsBelow50 = subjects.filter(s => s.marks < 50).map(s => s.subjectName);
  
  return {
    isFirstResult: true,
    strongestSubject,
    weakestSubject,
    subjectSpread,
    balanceScore: Math.round(balanceScore),
    subjectsAbove70,
    subjectsBelow50,
    classComparison: classData ? {
      classAverage: classData.average,
      aboveClassAverage: avg > classData.average,
      percentile: classData.percentile
    } : null
  };
}

/**
 * Generate smart recommendations based on analysis
 * @param {Object} analysis - Complete analysis object
 * @param {Object} currentResult - Current result
 * @param {Array} allResults - All historical results
 * @returns {Array} - Array of recommendation objects
 */
export function generateSmartRecommendations(analysis, currentResult, allResults) {
  const recommendations = [];
  const avg = currentResult?.averageMarks || 0;
  
  // Risk-based recommendations
  if (analysis.riskLevel === 'high') {
    recommendations.push({
      priority: 'urgent',
      category: 'general',
      title: 'Immediate Attention Required',
      detail: 'Performance indicates need for intervention',
      actions: [
        'Schedule parent-teacher meeting immediately',
        'Consider additional academic support',
        'Review study environment and habits',
        'Check for personal/health issues affecting performance'
      ]
    });
  }
  
  // Trend-based recommendations
  if (analysis.historicalAnalysis?.overallTrend === 'declining') {
    recommendations.push({
      priority: 'high',
      category: 'study-habits',
      title: 'Address Declining Performance',
      detail: `Performance has been declining over ${analysis.historicalAnalysis.termCount || 'multiple'} terms`,
      actions: [
        'Review and restructure study schedule',
        'Identify specific topics causing difficulty',
        'Consider peer study groups',
        'Seek help from teachers during free periods'
      ]
    });
  } else if (analysis.historicalAnalysis?.overallTrend === 'improving') {
    recommendations.push({
      priority: 'low',
      category: 'general',
      title: 'Maintain Positive Momentum',
      detail: 'Great progress! Keep up the current efforts',
      actions: [
        'Continue current study routine',
        'Set higher targets for next term',
        'Help classmates who may be struggling',
        'Consider challenging yourself with advanced materials'
      ]
    });
  }
  
  // Subject-specific recommendations
  if (analysis.consistentlyWeakSubjects?.length > 0) {
    const weakSubjects = analysis.consistentlyWeakSubjects.slice(0, 3);
    recommendations.push({
      priority: 'high',
      category: 'subject',
      title: `Focus on ${weakSubjects[0]}`,
      detail: `${weakSubjects.join(', ')} ${weakSubjects.length > 1 ? 'have' : 'has'} been consistently below average`,
      actions: [
        `Request extra help sessions for ${weakSubjects[0]}`,
        'Practice with past exam papers',
        `Study ${weakSubjects[0]} concepts for 30 mins daily`,
        'Form a study group with classmates who excel in these subjects'
      ]
    });
  }
  
  if (analysis.consistentlyStrongSubjects?.length > 0) {
    const strongSubjects = analysis.consistentlyStrongSubjects.slice(0, 3);
    recommendations.push({
      priority: 'low',
      category: 'subject',
      title: 'Leverage Your Strengths',
      detail: `Excellent in ${strongSubjects.join(', ')}`,
      actions: [
        'Maintain performance in strong subjects',
        'Help tutor classmates in these areas',
        'Consider subject-related competitions',
        'Explore advanced topics or resources'
      ]
    });
  }
  
  // Attendance recommendations
  if (currentResult?.attendance) {
    const absentRate = currentResult.attendance.daysAbsent / (currentResult.attendance.totalDays || 1);
    if (absentRate > 0.1) {
      recommendations.push({
        priority: absentRate > 0.2 ? 'urgent' : 'medium',
        category: 'attendance',
        title: 'Improve Attendance',
        detail: `Missed ${currentResult.attendance.daysAbsent} out of ${currentResult.attendance.totalDays} days (${(absentRate * 100).toFixed(0)}%)`,
        actions: [
          'Aim for at least 95% attendance',
          'Get notes from classmates for missed days',
          'Discuss attendance barriers with school administration',
          'Consider health checkup if illness is a factor'
        ]
      });
    }
  }
  
  // First result specific recommendations
  if (analysis.firstResultAnalysis?.isFirstResult) {
    const firstAnalysis = analysis.firstResultAnalysis;
    
    if (firstAnalysis.subjectsBelow50?.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'subject',
        title: 'Address Weak Areas Early',
        detail: `Foundation needed in: ${firstAnalysis.subjectsBelow50.join(', ')}`,
        actions: [
          `Focus extra study time on ${firstAnalysis.subjectsBelow50[0]}`,
          'Build strong fundamentals early',
          'Ask teachers for additional resources',
          'Practice regularly rather than cramming'
        ]
      });
    }
    
    if (firstAnalysis.balanceScore < 50) {
      recommendations.push({
        priority: 'medium',
        category: 'study-habits',
        title: 'Balance Your Performance',
        detail: `Large gap (${firstAnalysis.subjectSpread} marks) between best and worst subjects`,
        actions: [
          'Allocate more time to weaker subjects',
          'Create a balanced study schedule',
          `Maintain ${firstAnalysis.strongestSubject} while improving others`,
          'Don\'t neglect any subject'
        ]
      });
    }
  }
  
  // Goal-setting recommendations
  if (avg < 70 && avg >= 50) {
    const targetGrade = avg < 60 ? 'C+' : 'B';
    recommendations.push({
      priority: 'medium',
      category: 'goal',
      title: 'Set Achievement Goals',
      detail: `Current average: ${avg.toFixed(1)}%. Target: ${targetGrade} grade (${avg < 60 ? '60' : '70'}%+)`,
      actions: [
        `Work towards ${(avg + 10).toFixed(0)}% next term`,
        'Focus on subjects closest to next grade boundary',
        'Track weekly progress',
        'Celebrate small improvements'
      ]
    });
  }
  
  // Prediction-based recommendations
  if (analysis.projectedNextTermAverage) {
    const projected = analysis.projectedNextTermAverage;
    if (projected < avg - 5) {
      recommendations.push({
        priority: 'high',
        category: 'general',
        title: 'Prevent Projected Decline',
        detail: `Based on trends, next term average may drop to ~${projected.toFixed(0)}%`,
        actions: [
          'Take proactive steps now',
          'Address weakening subjects immediately',
          'Increase study hours',
          'Seek additional support before next term'
        ]
      });
    }
  }
  
  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

/**
 * Complete analysis function that combines all analyses
 * @param {String} studentId - Student ID
 * @param {Object} currentResult - Current result being analyzed
 * @param {Array} allResults - All results for this student
 * @returns {Object} - Complete analysis object
 */
export async function performCompleteAnalysis(studentId, currentResult, allResults) {
  // Sort results chronologically (oldest first)
  const sortedResults = [...allResults].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    const termOrder = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
    return (termOrder[a.term] || 0) - (termOrder[b.term] || 0);
  });
  
  const isFirstResult = sortedResults.length <= 1;
  const previousResult = sortedResults.length > 1 ? sortedResults[sortedResults.length - 2] : null;
  
  // Basic performance change
  const performanceChange = previousResult 
    ? (currentResult.averageMarks || 0) - (previousResult.averageMarks || 0)
    : null;
  
  // Previous term average
  const previousTermAverage = previousResult?.averageMarks || null;
  
  // Basic weak/strong subjects
  const avg = currentResult.averageMarks || 0;
  const weakSubjects = currentResult.subjects
    ?.filter(s => s.marks < avg - 5)
    .map(s => s.subjectName) || [];
  const strongSubjects = currentResult.subjects
    ?.filter(s => s.marks >= avg + 10)
    .map(s => s.subjectName) || [];
  
  // Historical analysis
  const overallTrend = calculateOverallTrend(sortedResults);
  const extremeTerms = findExtremeTerms(sortedResults);
  const termAverages = sortedResults.map(r => ({
    term: r.term,
    year: r.year,
    average: r.averageMarks
  }));
  
  // Calculate average improvement per term
  let averageImprovement = null;
  if (sortedResults.length >= 2) {
    const changes = [];
    for (let i = 1; i < sortedResults.length; i++) {
      changes.push((sortedResults[i].averageMarks || 0) - (sortedResults[i-1].averageMarks || 0));
    }
    averageImprovement = changes.reduce((a, b) => a + b, 0) / changes.length;
  }
  
  const historicalAnalysis = {
    overallTrend,
    termCount: sortedResults.length,
    peakAverage: extremeTerms.bestTerm?.average,
    lowestAverage: extremeTerms.worstTerm?.average,
    averageImprovement: averageImprovement ? Math.round(averageImprovement * 10) / 10 : null,
    termAverages
  };
  
  // Subject analysis
  const subjectAnalysis = analyzeSubjectTrends(sortedResults);
  
  // Consistent subjects
  const consistentSubjects = findConsistentSubjects(sortedResults);
  
  // Risk assessment
  const riskAssessment = assessRisk(sortedResults, currentResult);
  
  // Predictions
  const projectedNextTermAverage = predictNextTermAverage(sortedResults);
  
  // First result analysis
  const firstResultAnalysis = isFirstResult 
    ? analyzeFirstResult(currentResult)
    : { isFirstResult: false };
  
  // Compile base analysis
  const analysis = {
    performanceChange,
    previousTermAverage,
    weakSubjects,
    strongSubjects,
    historicalAnalysis,
    subjectAnalysis,
    consistentlyWeakSubjects: consistentSubjects.consistentlyWeak,
    consistentlyStrongSubjects: consistentSubjects.consistentlyStrong,
    improvedSubjects: consistentSubjects.improved,
    declinedSubjects: consistentSubjects.declined,
    riskLevel: riskAssessment.riskLevel,
    riskFactors: riskAssessment.riskFactors,
    projectedNextTermAverage,
    firstResultAnalysis
  };
  
  // Generate smart recommendations
  const recommendations = generateSmartRecommendations(analysis, currentResult, sortedResults);
  analysis.recommendations = recommendations;
  
  // Generate improvement areas (legacy compatibility)
  const improvementAreas = [];
  if (performanceChange !== null && performanceChange < 0) {
    improvementAreas.push("Overall performance declined - review study methods");
  }
  if (weakSubjects.length > 0) {
    improvementAreas.push(`Focus on: ${weakSubjects.slice(0, 3).join(", ")}`);
  }
  if (avg < 50) {
    improvementAreas.push("Consider extra tutoring in weak subjects");
  }
  if (currentResult.attendance?.daysAbsent > 5) {
    improvementAreas.push("Improve attendance to enhance learning");
  }
  if (isFirstResult) {
    improvementAreas.push("First term - build strong study habits early");
  }
  if (improvementAreas.length === 0) {
    improvementAreas.push("Keep up the good work!");
  }
  analysis.improvementAreas = improvementAreas;
  
  return analysis;
}

export default {
  calculateOverallTrend,
  findExtremeTerms,
  analyzeSubjectTrends,
  findConsistentSubjects,
  predictNextTermAverage,
  assessRisk,
  analyzeFirstResult,
  generateSmartRecommendations,
  performCompleteAnalysis
};
