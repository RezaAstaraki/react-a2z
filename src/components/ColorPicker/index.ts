import ColorPicker from "./ColorPicker";
import GradientMaker, { gradientToCss } from "../GradientMaker/GradientMaker";

export type {
  ColorPickerProps,
  ColorPickerClassNames,
  ColorPickerStyles,
} from "./ColorPicker";
export type {
  GradientPreset,
  GradientStop,
  GradientType,
  GradientValue,
  GradientMakerProps,
  GradientMakerClassNames,
  GradientMakerStyles,
} from "../GradientMaker/GradientMaker";

export { ColorPicker, GradientMaker, gradientToCss };
export default ColorPicker;
