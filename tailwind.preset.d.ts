/** Tailwind v3 preset containing the React A2Z token mappings. */
declare const preset: {
  theme: {
    extend: {
      colors: Record<string, string | Record<string, string>>;
      borderRadius: Record<string, string>;
      boxShadow: Record<string, string>;
      fontFamily: Record<string, string>;
      transitionDuration: Record<string, string>;
      transitionTimingFunction: Record<string, string>;
      ringWidth: Record<string, string>;
      ringOffsetWidth: Record<string, string>;
    };
  };
  plugins: [];
};
export declare const contentPaths: string[];
export declare const tokenStylesheets: string[];
export declare const tailwindV4Stylesheet = "react-a2z/tailwind.css";
export default preset;
