import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

export function WionLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(props.className)}
      {...props}
    >
      <title>Wion Logo</title>
      <style>
        {`
          @keyframes draw-n {
            to {
              stroke-dashoffset: 0;
            }
          }
          .animate-draw-n path {
            stroke-dasharray: 300;
            stroke-dashoffset: 300;
            animation: draw-n 1.5s ease-out forwards;
          }
        `}
      </style>
      <g className="animate-draw-n">
        <path 
          d="M 20 80 L 20 20 L 80 80 L 80 20" 
          stroke="currentColor" 
          strokeWidth="10" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </g>
    </svg>
  );
}
