import { cssInterop } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";

cssInterop(LinearGradient, { className: "style" });
cssInterop(BlurView, { className: "style" });
cssInterop(Image, { className: "style" });
