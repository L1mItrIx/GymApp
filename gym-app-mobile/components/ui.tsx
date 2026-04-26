import { Pressable, Text, TextInput, View } from "react-native";
import type {
  PressableProps,
  TextInputProps,
  ViewProps,
  TextProps,
} from "react-native";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary:   { container: "bg-indigo-500 active:bg-indigo-400",                                 text: "text-white" },
  secondary: { container: "bg-white/5 border border-white/10 active:bg-white/10",               text: "text-neutral-100" },
  ghost:     { container: "active:bg-white/5",                                                  text: "text-neutral-300" },
  danger:    { container: "bg-red-500/15 border border-red-500/30 active:bg-red-500/25",        text: "text-red-300" },
};

export function Button({
  variant = "primary",
  children,
  className = "",
  textClassName = "",
  disabled,
  onPress,
  ...rest
}: PressableProps & {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  textClassName?: string;
}) {
  const s = buttonStyles[variant];
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      disabled={disabled}
      className={[
        "flex-row items-center justify-center gap-2 px-4 py-3 rounded-lg",
        s.container,
        disabled ? "opacity-50" : "",
        className,
      ].join(" ")}
    >
      {typeof children === "string" ? (
        <Text className={["text-sm font-semibold", s.text, textClassName].join(" ")}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export function Card({ className = "", children, ...rest }: ViewProps & { children: ReactNode }) {
  return (
    <View
      {...rest}
      className={["bg-surface border border-border rounded-xl p-4", className].join(" ")}
    >
      {children}
    </View>
  );
}

export function Input({ className = "", ...rest }: TextInputProps) {
  return (
    <TextInput
      {...rest}
      placeholderTextColor="#6b7280"
      className={[
        "bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-foreground",
        className,
      ].join(" ")}
    />
  );
}

export function Label({ className = "", children, ...rest }: TextProps & { children: ReactNode }) {
  return (
    <Text {...rest} className={["text-xs text-neutral-400 mb-1.5 font-medium", className].join(" ")}>
      {children}
    </Text>
  );
}

export function H1({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <Text className={["text-foreground text-2xl font-semibold", className].join(" ")}>
      {children}
    </Text>
  );
}

export function H2({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <Text className={["text-foreground text-base font-semibold", className].join(" ")}>
      {children}
    </Text>
  );
}

export function Muted({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <Text className={["text-neutral-400 text-sm", className].join(" ")}>
      {children}
    </Text>
  );
}
