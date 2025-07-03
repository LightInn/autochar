import type { EmotionType } from './intentionAnalyzer';

// Types pour les éléments du stickman
export interface StickmanPose {
  head: {
    expression: EmotionType;
    rotation: number; // -30 à 30 degrés
  };
  body: {
    lean: number; // -15 à 15 degrés
  };
  leftArm: {
    rotation: number; // 0 à 180 degrés
    bend: number; // 0 à 90 degrés (coude)
  };
  rightArm: {
    rotation: number;
    bend: number;
  };
  leftLeg: {
    rotation: number; // -30 à 30 degrés
    bend: number; // 0 à 45 degrés (genou)
  };
  rightLeg: {
    rotation: number;
    bend: number;
  };
}

// Configuration des poses par émotion
export const EMOTION_POSES: Record<EmotionType, StickmanPose> = {
  neutral: {
    head: { expression: 'neutral', rotation: 0 },
    body: { lean: 0 },
    leftArm: { rotation: 30, bend: 10 },
    rightArm: { rotation: -30, bend: 10 },
    leftLeg: { rotation: 0, bend: 5 },
    rightLeg: { rotation: 0, bend: 5 }
  },
  
  happy: {
    head: { expression: 'happy', rotation: 5 },
    body: { lean: 2 },
    leftArm: { rotation: 45, bend: 20 },
    rightArm: { rotation: -45, bend: 20 },
    leftLeg: { rotation: -5, bend: 10 },
    rightLeg: { rotation: 5, bend: 10 }
  },
  
  excited: {
    head: { expression: 'excited', rotation: 10 },
    body: { lean: 5 },
    leftArm: { rotation: 120, bend: 30 },
    rightArm: { rotation: -120, bend: 30 },
    leftLeg: { rotation: -10, bend: 15 },
    rightLeg: { rotation: 10, bend: 15 }
  },
  
  sad: {
    head: { expression: 'sad', rotation: -10 },
    body: { lean: -5 },
    leftArm: { rotation: 10, bend: 5 },
    rightArm: { rotation: -10, bend: 5 },
    leftLeg: { rotation: 2, bend: 0 },
    rightLeg: { rotation: -2, bend: 0 }
  },
  
  angry: {
    head: { expression: 'angry', rotation: -5 },
    body: { lean: -8 },
    leftArm: { rotation: 80, bend: 45 },
    rightArm: { rotation: -80, bend: 45 },
    leftLeg: { rotation: -8, bend: 20 },
    rightLeg: { rotation: 8, bend: 20 }
  },
  
  surprised: {
    head: { expression: 'surprised', rotation: 15 },
    body: { lean: 8 },
    leftArm: { rotation: 60, bend: 35 },
    rightArm: { rotation: -60, bend: 35 },
    leftLeg: { rotation: 0, bend: 25 },
    rightLeg: { rotation: 0, bend: 25 }
  },
  
  confused: {
    head: { expression: 'confused', rotation: 20 },
    body: { lean: 3 },
    leftArm: { rotation: 40, bend: 60 },
    rightArm: { rotation: -20, bend: 15 },
    leftLeg: { rotation: 5, bend: 10 },
    rightLeg: { rotation: -5, bend: 5 }
  },
  
  thinking: {
    head: { expression: 'thinking', rotation: 25 },
    body: { lean: -2 },
    leftArm: { rotation: 15, bend: 5 },
    rightArm: { rotation: -90, bend: 80 }, // Main sur le menton
    leftLeg: { rotation: 0, bend: 5 },
    rightLeg: { rotation: 0, bend: 5 }
  },
  
  worried: {
    head: { expression: 'worried', rotation: -8 },
    body: { lean: -10 },
    leftArm: { rotation: 25, bend: 40 },
    rightArm: { rotation: -25, bend: 40 },
    leftLeg: { rotation: 3, bend: 8 },
    rightLeg: { rotation: -3, bend: 8 }
  },
  
  disappointed: {
    head: { expression: 'disappointed', rotation: -15 },
    body: { lean: -12 },
    leftArm: { rotation: 5, bend: 2 },
    rightArm: { rotation: -5, bend: 2 },
    leftLeg: { rotation: 0, bend: 0 },
    rightLeg: { rotation: 0, bend: 0 }
  }
};

// Fonction pour interpoler entre deux poses
export function interpolatePoses(poseA: StickmanPose, poseB: StickmanPose, t: number): StickmanPose {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  
  return {
    head: {
      expression: t < 0.5 ? poseA.head.expression : poseB.head.expression,
      rotation: lerp(poseA.head.rotation, poseB.head.rotation, t)
    },
    body: {
      lean: lerp(poseA.body.lean, poseB.body.lean, t)
    },
    leftArm: {
      rotation: lerp(poseA.leftArm.rotation, poseB.leftArm.rotation, t),
      bend: lerp(poseA.leftArm.bend, poseB.leftArm.bend, t)
    },
    rightArm: {
      rotation: lerp(poseA.rightArm.rotation, poseB.rightArm.rotation, t),
      bend: lerp(poseA.rightArm.bend, poseB.rightArm.bend, t)
    },
    leftLeg: {
      rotation: lerp(poseA.leftLeg.rotation, poseB.leftLeg.rotation, t),
      bend: lerp(poseA.leftLeg.bend, poseB.leftLeg.bend, t)
    },
    rightLeg: {
      rotation: lerp(poseA.rightLeg.rotation, poseB.rightLeg.rotation, t),
      bend: lerp(poseA.rightLeg.bend, poseB.rightLeg.bend, t)
    }
  };
}

// Fonction pour obtenir la pose d'une émotion avec variation
export function getPoseForEmotion(emotion: EmotionType, intensity: number = 1): StickmanPose {
  const basePose = EMOTION_POSES[emotion];
  const neutralPose = EMOTION_POSES.neutral;
  
  // Mélanger avec neutral selon l'intensité
  return interpolatePoses(neutralPose, basePose, intensity);
}
