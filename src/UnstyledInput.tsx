import { StyledPicker, StyledText, StyledView } from "@dwidge/components-rnw";
import { Input } from "@rneui/themed";
import React from "react";

export const UnstyledInput = ({
  label,
  value,
  onChange,
  error,
  options,
  secure,
  autoComplete,
  multiline,
}: {
  label?: string;
  value: string;
  onChange?: (setter: (prevState: string) => string) => unknown;
  error?: string;
  options?: { label: string; value: string }[];
  secure?: boolean;
  autoComplete?: "current-password" | "email";
  multiline?: number;
}) => (
  <StyledView sgap>
    <StyledText>{label}</StyledText>
    {error && <StyledText error>{error}</StyledText>}
    {options ? (
      <StyledPicker
        value={[
          value,
          onChange
            ? async (getV) => {
                const v = await (typeof getV === "function" ? getV("") : getV);
                return onChange((prev) => v), v;
              }
            : undefined,
        ]}
        options={options}
        unknownLabel="?"
      />
    ) : (
      <Input
        //@ts-ignore-error
        value={value}
        onChangeText={(v) => onChange?.(() => v)}
        secureTextEntry={secure}
        // @ts-ignore
        autoComplete={autoComplete}
        multiline={!secure && (multiline ?? 0) > 1}
        numberOfLines={multiline}
        textAlignVertical="top"
        renderErrorMessage={false}
        style={{ width: "100%" }}
        autoCapitalize={autoComplete === "email" || secure ? "none" : undefined}
        autoCorrect={autoComplete === "email" || secure ? false : undefined}
        textContentType={secure ? "password" : undefined}
      />
    )}
  </StyledView>
);
