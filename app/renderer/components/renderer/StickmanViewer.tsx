import React from 'react';
import type { StickmanPose } from '../../utils/stickmanPoses';
import type { EmotionType } from '../../utils/intentionAnalyzer';

interface StickmanViewerProps {
  pose: StickmanPose;
  size?: number;
  className?: string;
}

const StickmanViewer: React.FC<StickmanViewerProps> = ({ 
  pose, 
  size = 200,
  className = ""
}) => {
  // Fonction pour obtenir l'expression faciale
  const getFaceExpression = (expression: EmotionType) => {
    switch (expression) {
      case 'happy':
      case 'excited':
        return (
          <>
            {/* Yeux souriants */}
            <path d="M-8,-5 Q-5,-8 -2,-5" stroke="#333" strokeWidth="2" fill="none" />
            <path d="M2,-5 Q5,-8 8,-5" stroke="#333" strokeWidth="2" fill="none" />
            {/* Sourire */}
            <path d="M-6,3 Q0,8 6,3" stroke="#333" strokeWidth="2" fill="none" />
          </>
        );
      
      case 'sad':
      case 'disappointed':
        return (
          <>
            {/* Yeux tristes */}
            <path d="M-8,-3 Q-5,0 -2,-3" stroke="#333" strokeWidth="2" fill="none" />
            <path d="M2,-3 Q5,0 8,-3" stroke="#333" strokeWidth="2" fill="none" />
            {/* Bouche triste */}
            <path d="M-4,5 Q0,2 4,5" stroke="#333" strokeWidth="2" fill="none" />
          </>
        );
      
      case 'angry':
        return (
          <>
            {/* Sourcils froncés */}
            <line x1="-10" y1="-8" x2="-3" y2="-5" stroke="#333" strokeWidth="2" />
            <line x1="3" y1="-5" x2="10" y2="-8" stroke="#333" strokeWidth="2" />
            {/* Yeux en colère */}
            <circle cx="-5" cy="-2" r="2" fill="#333" />
            <circle cx="5" cy="-2" r="2" fill="#333" />
            {/* Bouche en colère */}
            <path d="M-5,5 Q0,8 5,5" stroke="#333" strokeWidth="2" fill="none" />
          </>
        );
      
      case 'surprised':
        return (
          <>
            {/* Yeux écarquillés */}
            <circle cx="-5" cy="-3" r="3" stroke="#333" strokeWidth="2" fill="none" />
            <circle cx="5" cy="-3" r="3" stroke="#333" strokeWidth="2" fill="none" />
            <circle cx="-5" cy="-3" r="1" fill="#333" />
            <circle cx="5" cy="-3" r="1" fill="#333" />
            {/* Bouche en O */}
            <circle cx="0" cy="4" r="3" stroke="#333" strokeWidth="2" fill="none" />
          </>
        );
      
      case 'confused':
        return (
          <>
            {/* Un sourcil levé */}
            <path d="M-8,-8 Q-5,-6 -2,-8" stroke="#333" strokeWidth="2" fill="none" />
            <line x1="3" y1="-6" x2="8" y2="-7" stroke="#333" strokeWidth="2" />
            {/* Yeux normaux */}
            <circle cx="-5" cy="-2" r="1.5" fill="#333" />
            <circle cx="5" cy="-2" r="1.5" fill="#333" />
            {/* Bouche perplexe */}
            <path d="M-3,4 Q-1,6 1,4 Q3,6 5,4" stroke="#333" strokeWidth="2" fill="none" />
          </>
        );
      
      case 'thinking':
        return (
          <>
            {/* Yeux fermés/concentrés */}
            <line x1="-8" y1="-3" x2="-2" y2="-3" stroke="#333" strokeWidth="2" />
            <line x1="2" y1="-3" x2="8" y2="-3" stroke="#333" strokeWidth="2" />
            {/* Bouche neutre */}
            <line x1="-3" y1="4" x2="3" y2="4" stroke="#333" strokeWidth="2" />
          </>
        );
      
      case 'worried':
        return (
          <>
            {/* Sourcils inquiets */}
            <path d="M-8,-6 Q-5,-8 -2,-6" stroke="#333" strokeWidth="2" fill="none" />
            <path d="M2,-6 Q5,-8 8,-6" stroke="#333" strokeWidth="2" fill="none" />
            {/* Yeux inquiets */}
            <circle cx="-5" cy="-2" r="1.5" fill="#333" />
            <circle cx="5" cy="-2" r="1.5" fill="#333" />
            {/* Bouche inquiète */}
            <path d="M-4,5 Q0,3 4,5" stroke="#333" strokeWidth="2" fill="none" />
          </>
        );
      
      default: // neutral
        return (
          <>
            {/* Yeux normaux */}
            <circle cx="-5" cy="-3" r="1.5" fill="#333" />
            <circle cx="5" cy="-3" r="1.5" fill="#333" />
            {/* Bouche neutre */}
            <line x1="-3" y1="4" x2="3" y2="4" stroke="#333" strokeWidth="2" />
          </>
        );
    }
  };

  // Calcul des positions des membres
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Tête
  const headY = centerY - 60;
  
  // Corps
  const bodyStartY = headY + 20;
  const bodyEndY = bodyStartY + 60;
  
  // Bras
  const shoulderY = bodyStartY + 15;
  const armLength = 40;
  
  // Jambes
  const hipY = bodyEndY;
  const legLength = 50;

  // Conversion des angles en radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Calcul des positions des bras
  const leftArmEndX = centerX + Math.cos(toRad(pose.leftArm.rotation)) * armLength;
  const leftArmEndY = shoulderY + Math.sin(toRad(pose.leftArm.rotation)) * armLength;
  
  const rightArmEndX = centerX + Math.cos(toRad(180 - pose.rightArm.rotation)) * armLength;
  const rightArmEndY = shoulderY + Math.sin(toRad(180 - pose.rightArm.rotation)) * armLength;

  // Calcul des positions des jambes
  const leftLegEndX = centerX + Math.cos(toRad(90 + pose.leftLeg.rotation)) * legLength;
  const leftLegEndY = hipY + Math.sin(toRad(90 + pose.leftLeg.rotation)) * legLength;
  
  const rightLegEndX = centerX + Math.cos(toRad(90 - pose.rightLeg.rotation)) * legLength;
  const rightLegEndY = hipY + Math.sin(toRad(90 - pose.rightLeg.rotation)) * legLength;

  return (
    <div className={`inline-block ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Corps */}
        <line
          x1={centerX}
          y1={bodyStartY}
          x2={centerX + Math.sin(toRad(pose.body.lean)) * 30}
          y2={bodyEndY}
          stroke="#333"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Tête */}
        <g transform={`translate(${centerX + Math.sin(toRad(pose.body.lean)) * 10}, ${headY}) rotate(${pose.head.rotation})`}>
          <circle cx="0" cy="0" r="15" stroke="#333" strokeWidth="3" fill="none" />
          {getFaceExpression(pose.head.expression)}
        </g>
        
        {/* Bras gauche */}
        <line
          x1={centerX}
          y1={shoulderY}
          x2={leftArmEndX}
          y2={leftArmEndY}
          stroke="#333"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Avant-bras gauche (si courbé) */}
        {pose.leftArm.bend > 10 && (
          <line
            x1={leftArmEndX}
            y1={leftArmEndY}
            x2={leftArmEndX + Math.cos(toRad(pose.leftArm.rotation + pose.leftArm.bend)) * 20}
            y2={leftArmEndY + Math.sin(toRad(pose.leftArm.rotation + pose.leftArm.bend)) * 20}
            stroke="#333"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        
        {/* Bras droit */}
        <line
          x1={centerX}
          y1={shoulderY}
          x2={rightArmEndX}
          y2={rightArmEndY}
          stroke="#333"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Avant-bras droit (si courbé) */}
        {pose.rightArm.bend > 10 && (
          <line
            x1={rightArmEndX}
            y1={rightArmEndY}
            x2={rightArmEndX + Math.cos(toRad(180 - pose.rightArm.rotation - pose.rightArm.bend)) * 20}
            y2={rightArmEndY + Math.sin(toRad(180 - pose.rightArm.rotation - pose.rightArm.bend)) * 20}
            stroke="#333"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        
        {/* Jambe gauche */}
        <line
          x1={centerX}
          y1={hipY}
          x2={leftLegEndX}
          y2={leftLegEndY}
          stroke="#333"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Mollet gauche (si courbé) */}
        {pose.leftLeg.bend > 5 && (
          <line
            x1={leftLegEndX}
            y1={leftLegEndY}
            x2={leftLegEndX + Math.cos(toRad(90 + pose.leftLeg.rotation - pose.leftLeg.bend)) * 25}
            y2={leftLegEndY + Math.sin(toRad(90 + pose.leftLeg.rotation - pose.leftLeg.bend)) * 25}
            stroke="#333"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        
        {/* Jambe droite */}
        <line
          x1={centerX}
          y1={hipY}
          x2={rightLegEndX}
          y2={rightLegEndY}
          stroke="#333"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Mollet droit (si courbé) */}
        {pose.rightLeg.bend > 5 && (
          <line
            x1={rightLegEndX}
            y1={rightLegEndY}
            x2={rightLegEndX + Math.cos(toRad(90 - pose.rightLeg.rotation + pose.rightLeg.bend)) * 25}
            y2={rightLegEndY + Math.sin(toRad(90 - pose.rightLeg.rotation + pose.rightLeg.bend)) * 25}
            stroke="#333"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        
        {/* Articulations */}
        <circle cx={centerX} cy={shoulderY} r="3" fill="#333" />
        <circle cx={centerX} cy={hipY} r="3" fill="#333" />
        <circle cx={leftArmEndX} cy={leftArmEndY} r="2" fill="#333" />
        <circle cx={rightArmEndX} cy={rightArmEndY} r="2" fill="#333" />
        <circle cx={leftLegEndX} cy={leftLegEndY} r="2" fill="#333" />
        <circle cx={rightLegEndX} cy={rightLegEndY} r="2" fill="#333" />
      </svg>
    </div>
  );
};

export default StickmanViewer;
