// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { StyledPicker, StyledText, StyledView } from "@dwidge/components-rnw";
import { BufferedState, useBufferedState } from "@dwidge/hooks-react";
import { Button, CheckBox, Input, Text } from "@rneui/themed";
import * as Ajv from "ajv";
import AjvErrors from "ajv-errors";
import addFormats from "ajv-formats";
import { assert } from "@dwidge/utils-js";
import React, {
  Dispatch,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
export { type JSONSchemaType } from "ajv";

const ajv = new Ajv.Ajv({ allErrors: true });
AjvErrors(ajv);
addFormats(ajv);

type SampleType = {
  age: number;
  name: string;
  isActive: boolean;
  profile: { bio: string };
  tags: string[];
  profileTags: { bio: string }[];
};
const formSchema: Ajv.JSONSchemaType<SampleType> = {
  type: "object",
  title: "SampleType",
  properties: {
    age: { type: "number", title: "Age", minimum: 1, maximum: 100 },
    name: { type: "string", title: "Name" },
    isActive: { type: "boolean", title: "Active" },
    profile: {
      type: "object",
      title: "Profile",
      properties: { bio: { type: "string", title: "Bio", maxLength: 150 } },
      required: ["bio"],
    },
    tags: {
      type: "array",
      title: "Tags",
      items: { type: "string" },
    },
    profileTags: {
      type: "array",
      title: "Profile Tags",
      items: {
        type: "object",
        title: "Profile",
        properties: { bio: { type: "string", title: "Bio" } },
        required: ["bio"],
      },
    },
  },
  required: ["age", "name", "isActive", "profile", "tags"],
};

export const SampleJsonSchemaForm: React.FC = () => {
  const [data, setData] = useState<SampleType>({
    age: 25,
    name: "John",
    isActive: true,
    profile: { bio: "Developer" },
    tags: ["react", "typescript"],
    profileTags: [],
  });

  return (
    <StyledView flex gap>
      <Text>SampleJsonSchemaForm</Text>
      <Text>{JSON.stringify(data)}</Text>
      <JSONSchemaForm
        name="SampleJsonSchemaForm"
        schema={formSchema}
        value={data}
        onChange={setData}
      />
    </StyledView>
  );
};

export type JsonSchemaFormProps<T, S> = {
  name: string;
  schema: Ajv.JSONSchemaType<S>;
  value: T;
  onChange?: Dispatch<(prev: T) => T>;
};

export const JSONSchemaForm = <T, S>({
  name,
  schema,
  value,
  onChange,
}: JsonSchemaFormProps<T, S>): JSX.Element => {
  const [delayed, setDelayed] = useBufferedState([
    value,
    onChange ? (v) => onChange?.(() => v) : undefined,
  ]);
  return (
    <AnyInput
      name={name}
      schema={schema as Schema<"object">}
      value={delayed}
      onChange={setDelayed}
    />
  );
};

type Schema<T extends Ajv.JSONType> = {
  type?: T;
  title?: string;
  items?: Schema<any>;
  properties?: any;
  enum?: T[];
  format?: string;
  maxLength?: number;
};
type InputControlProps<T extends Ajv.JSONType, V> = {
  name: string;
  schema: Schema<T>;
  error?: string;
} & State<V>;
type InputControl<T extends Ajv.JSONType, V> = (
  p: InputControlProps<T, V>,
) => ReactNode;

const AnyInput = memo(
  ({
    schema,
    name,
    value,
    onChange,
    Component = InputTypes[schema.type as Ajv.JSONType],
  }: InputControlProps<Ajv.JSONType, any> & {
    Component?: InputControl<Ajv.JSONType, any>;
  }) => (
    <Component
      {...{
        schema,
        name,
        value,
        onChange,
      }}
    />
  ),
);

const TextInput: InputControl<"string", string | null | undefined> = memo(
  ({ schema, name, value, onChange, error = useValidate(schema, value) }) => (
    <UnstyledInput
      label={schema.title ?? name}
      value={value ?? ""}
      onChange={(v) => onChange?.((value) => v(value ?? "") || null, name)}
      error={error}
      options={schema.enum?.map((value) => ({ value, label: value }))}
      secure={schema.format === "password"}
      autoComplete={
        schema.format === "email"
          ? "email"
          : schema.format === "password"
            ? "current-password"
            : undefined
      }
      multiline={((((schema.maxLength ?? 1) - 1) / 128) | 0) + 1}
    />
  ),
);

const NumberInput: InputControl<"number", number | undefined> = memo(
  ({
    schema,
    name,
    value,
    onChange,
    state: [state, setState] = useBufferedState<string>([
      value != undefined ? String(value) : "",
      (v) =>
        (v === "" || !isNaN(Number(v))) &&
        onChange?.((value) => (v === "" ? undefined : Number(v)), name),
    ]),
    error = useValidate(schema, Number(state)),
  }: InputControlProps<"number", number | undefined> & {
    state?: BufferedState<string>;
    error?: string;
  }) => (
    <UnstyledInput
      label={schema.title ?? name}
      value={state}
      onChange={setState}
      error={error}
    />
  ),
);

const BooleanInput: InputControl<"boolean", boolean | undefined> = memo(
  ({ schema, name, value, onChange, error = useValidate(schema, value) }) => (
    <StyledView>
      <StyledView row sgap style={{ flexWrap: "wrap" }}>
        <CheckBox
          checked={value ?? false}
          onPress={() => onChange?.((value) => !value, name)}
        />
        <StyledText onPress={() => onChange?.((value) => !value, name)}>
          {schema.title ?? name}
        </StyledText>
      </StyledView>
      {error && <StyledText error>({error})</StyledText>}
    </StyledView>
  ),
);

const ObjectInput: InputControl<"object", object> = memo(
  ({
    schema,
    name,
    value,
    onChange,
    onChangeMemo = useCallback<SetState<object>>(
      (v, key) =>
        onChange?.(
          (value) => ({
            ...value,
            [key]: v(value?.[key as keyof typeof value]),
          }),
          name,
        ),
      [],
    ),
  }: InputControlProps<"object", object> & {
    onChangeMemo?: SetState<object>;
  }) => (
    <StyledView flex gap>
      {schema.title && <Text>{schema.title}</Text>}
      {Object.keys(schema.properties).map((key) => (
        <StyledView key={key}>
          <AnyInput
            name={key}
            schema={schema.properties[key as keyof typeof value]}
            value={value?.[key as keyof typeof value]}
            onChange={onChangeMemo}
          />
        </StyledView>
      ))}
    </StyledView>
  ),
);

const ArrayInput: InputControl<"array", any[]> = memo(
  ({ schema, name, value, onChange }) => (
    <StyledView gap>
      <Text>{schema.title ?? name}</Text>
      {(value ?? []).map((item, index) => (
        <StyledView key={index} row center spad sgap outline>
          <StyledView flex>
            <AnyInput
              name={String(index)}
              schema={(assert(schema.items), schema.items)}
              value={item}
              onChange={(v, k) =>
                onChange?.(
                  (value) =>
                    (value ?? []).map((i, idx) => (idx === index ? v(i) : i)),
                  name,
                )
              }
            />
          </StyledView>
          <Button
            title="-"
            onPress={() =>
              onChange?.(
                (value) => (value ?? []).filter((_, idx) => idx !== index),
                name,
              )
            }
          />
        </StyledView>
      ))}
      <Button
        title="+"
        onPress={() =>
          onChange?.((value) => [...(value ?? []), undefined], name)
        }
      />
    </StyledView>
  ),
);

const InputTypes: Record<Ajv.JSONType, InputControl<any, any>> = {
  string: TextInput,
  number: NumberInput,
  boolean: BooleanInput,
  object: ObjectInput,
  integer: NumberInput,
  null: () => null,
  array: ArrayInput,
};

const UnstyledInput = ({
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
  <StyledView flex sgap>
    <StyledText>
      {label}
      {error && <StyledText error> ({error})</StyledText>}
    </StyledText>
    {options ? (
      <StyledPicker value={value} onChange={onChange} options={options} />
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
      />
    )}
  </StyledView>
);

type SetState<T> = (value: (prevState: T) => T, name: string) => unknown;
type State<T> = {
  value: T;
  onChange?: SetState<T>;
};

const useValidate = <T extends Ajv.JSONType>(
  schema: Schema<T>,
  value: any,
): string | undefined => {
  const [errors, setErrors] = useState<Ajv.ErrorObject[]>([]);

  useEffect(() => {
    const validate = ajv.compile(schema);
    validate(value);
    setErrors(validate.errors || []);
  }, [value]);

  const error = errors[0];
  return error
    ? error.keyword === "errorMessage"
      ? error.message
      : (errorMessages[error.keyword as keyof typeof errorMessages] ??
        errorMessages.default)
    : undefined;
};

const errorMessages = {
  minLength: "Too short",
  maxLength: "Too long",
  minimum: "Too small",
  maximum: "Too large",
  required: "Required",
  type: "Required",
  pattern: "Invalid",
  format: "Invalid",
  enum: "Invalid",
  default: "Invalid",
};
