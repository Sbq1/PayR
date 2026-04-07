interface ThemeProviderProps {
  children: React.ReactNode;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
}

/**
 * Inyecta los colores del restaurante como CSS variables.
 * Se usan en los componentes del flujo customer con var(--r-primary), etc.
 */
export function ThemeProvider({
  children,
  primaryColor,
  secondaryColor,
  backgroundColor,
}: ThemeProviderProps) {
  return (
    <div
      style={
        {
          "--r-primary": primaryColor,
          "--r-secondary": secondaryColor,
          "--r-bg": backgroundColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
