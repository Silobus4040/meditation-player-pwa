// v3 Enhance: Intelligently adds emotion tags to Bible verse text
// Based on biblical language patterns and emotional analysis

interface TagRule {
  tag: string;
  keywords: string[];
  priority: number;
}

const EMOTION_RULES: TagRule[] = [
  // Worship & Praise
  {
    tag: 'reverent',
    keywords: ['holy', 'sanctify', 'hallowed', 'glori', 'majest', 'almighty', 'throne', 'worship', 'bow', 'exalt', 'most high', 'sovereign'],
    priority: 3,
  },
  {
    tag: 'joyful',
    keywords: ['rejoice', 'glad', 'sing', 'praise', 'bless', 'delight', 'joy', 'celebrate', 'dance', 'triumph', 'shout for joy', 'clap', 'happy'],
    priority: 2,
  },
  // Sorrow & Lament
  {
    tag: 'sad',
    keywords: ['sorrow', 'weep', 'mourn', 'grief', 'tears', 'death', 'die', 'perish', 'destroy', 'anguish', 'bitter', 'lament', 'woe', 'desolat'],
    priority: 3,
  },
  {
    tag: 'sorrowful',
    keywords: ['forsak', 'abandon', 'forgot', 'cast off', 'reject', 'broken', 'wound', 'pain', 'suffer', 'afflict'],
    priority: 2,
  },
  // Prayer & Petition
  {
    tag: 'pleading',
    keywords: ['beseech', 'implore', 'o lord', 'have mercy', 'hear my', 'cry out', 'save me', 'deliver me', 'help me', 'rescue', 'spare'],
    priority: 3,
  },
  {
    tag: 'earnest',
    keywords: ['pray', 'petition', 'supplicat', 'intercede', 'seek', 'call upon', 'ask', 'knock', 'entreat'],
    priority: 2,
  },
  // Comfort & Peace
  {
    tag: 'gentle',
    keywords: ['comfort', 'peace', 'still', 'quiet', 'rest', 'calm', 'tender', 'gentle', 'pasture', 'shepherd', 'waters', 'beside'],
    priority: 2,
  },
  {
    tag: 'comforting',
    keywords: ['fear not', 'do not fear', 'be not afraid', 'i am with', 'never leave', 'hold your hand', 'uphold', 'sustain', 'shelter', 'refuge'],
    priority: 3,
  },
  // Relief & Gratitude
  {
    tag: 'relieved',
    keywords: ['return', 'rest', 'deliver', 'freed', 'saved', 'redeemed', 'restored', 'healed', 'answered', 'rescue'],
    priority: 2,
  },
  {
    tag: 'grateful',
    keywords: ['thank', 'grateful', 'bountifully', 'bestow', 'given', 'grace', 'gift', 'merciful', 'loving-kindness', 'faithfulness'],
    priority: 2,
  },
  // Reflection & Contemplation
  {
    tag: 'thoughtful',
    keywords: ['consider', 'ponder', 'meditat', 'remember', 'think', 'know', 'understand', 'wisdom', 'heart', 'incline', 'in the beginning'],
    priority: 1,
  },
  {
    tag: 'contemplative',
    keywords: ['selah', 'what is man', 'how long', 'why', 'where', 'number', 'count', 'days', 'time', 'eternal', 'everlast'],
    priority: 1,
  },
  // Authority & Power
  {
    tag: 'authoritative',
    keywords: ['command', 'decree', 'ordain', 'thus saith', 'says the lord', 'declare', 'proclaim', 'judge', 'reign', 'rule', 'power', 'mighty'],
    priority: 2,
  },
  {
    tag: 'stern',
    keywords: ['wrath', 'anger', 'punish', 'judgment', 'condemn', 'rebuk', 'chasten', 'warn', 'vengeance', 'repent', 'turn from'],
    priority: 3,
  },
  // Hope & Encouragement
  {
    tag: 'hopeful',
    keywords: ['hope', 'promise', 'future', 'new', 'renew', 'strength', 'rise', 'morning', 'dawn', 'light', 'trust', 'wait upon', 'endure'],
    priority: 2,
  },
  // Love
  {
    tag: 'warm',
    keywords: ['love', 'beloved', 'dear', 'precious', 'chosen', 'embrace', 'child', 'son', 'daughter', 'bride', 'father'],
    priority: 1,
  },
];

function detectEmotion(sentence: string): string | null {
  const lower = sentence.toLowerCase();
  let bestTag: string | null = null;
  let bestPriority = -1;
  let bestMatches = 0;

  for (const rule of EMOTION_RULES) {
    let matches = 0;
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        matches++;
      }
    }
    if (matches > 0 && (rule.priority > bestPriority || (rule.priority === bestPriority && matches > bestMatches))) {
      bestTag = rule.tag;
      bestPriority = rule.priority;
      bestMatches = matches;
    }
  }

  return bestTag;
}

function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation, keeping the punctuation
  const raw = text.split(/(?<=[.!?…;:])\s+/);
  
  // Merge very short fragments back together
  const merged: string[] = [];
  for (const s of raw) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if (merged.length > 0 && merged[merged.length - 1].length < 30) {
      merged[merged.length - 1] += ' ' + trimmed;
    } else {
      merged.push(trimmed);
    }
  }
  return merged;
}

export function enhanceWithEmotionTags(text: string): string {
  const sentences = splitIntoSentences(text.trim());
  if (sentences.length === 0) return text;

  let lastTag: string | null = null;
  const enhanced: string[] = [];

  for (const sentence of sentences) {
    // Skip if it already has a tag
    if (/^\[.+?\]/.test(sentence.trim())) {
      enhanced.push(sentence);
      const existingTag = sentence.match(/^\[(.+?)\]/)?.[1] || null;
      lastTag = existingTag;
      continue;
    }

    const emotion = detectEmotion(sentence);
    
    if (emotion && emotion !== lastTag) {
      enhanced.push(`[${emotion}] ${sentence}`);
      lastTag = emotion;
    } else {
      enhanced.push(sentence);
    }
  }

  return enhanced.join('\n\n');
}
