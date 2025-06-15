import { StyledButton } from "@dwidge/components-rnw";
import React from "react";

export const EyeButton = ({
  isVisible,
  onToggle,
}: {
  isVisible: boolean;
  onToggle: () => void;
}) => <StyledButton onPress={onToggle} icon={isVisible ? "eye-off" : "eye"} />;
