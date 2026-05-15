import { useEffect, useRef } from "react";
import { revealPane, staggerCards } from "./workspaceAnimations";

export function WorkspaceView({ children, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    revealPane(ref.current);
    staggerCards(ref.current);
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
