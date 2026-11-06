import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { WorkoutTheme } from "@/constants/Colors";
import { WORDMARK_GLYPHS } from "./logoWordmark";

// Longueurs des tracés (pour l'effet de dessin).
const ARC_LENGTH = 354;
const CHEVRON_LENGTH = 102;

// Lockup empilé : symbole au-dessus, titre « GRINTA. » dessous (viewBox 344 × 340).
const VIEWBOX_W = 344;
const VIEWBOX_H = 340;
const DISPLAY_WIDTH = 270;
const DISPLAY_HEIGHT = (DISPLAY_WIDTH * VIEWBOX_H) / VIEWBOX_W;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

type Props = {
  /** Appelé une fois l'animation terminée (logo dessiné puis fondu). */
  onFinish: () => void;
};

export default function LogoIntro({ onFinish }: Props) {
  const arcOffset = useSharedValue(ARC_LENGTH);
  const chevronAOffset = useSharedValue(CHEVRON_LENGTH);
  const chevronBOffset = useSharedValue(CHEVRON_LENGTH);
  const titleOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    arcOffset.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    chevronAOffset.value = withDelay(
      700,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }),
    );

    chevronBOffset.value = withDelay(
      950,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }),
    );

    // Le titre apparaît une fois le logo presque complet.
    titleOpacity.value = withDelay(
      1100,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }),
    );

    // Un peu plus long qu'avant pour laisser lire le titre avant le fondu.
    containerOpacity.value = withDelay(
      2000,
      withTiming(
        0,
        { duration: 350, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(onFinish)();
        },
      ),
    );
    // L'animation ne doit se jouer qu'une fois, au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: arcOffset.value,
  }));
  const chevronAProps = useAnimatedProps(() => ({
    strokeDashoffset: chevronAOffset.value,
  }));
  const chevronBProps = useAnimatedProps(() => ({
    strokeDashoffset: chevronBOffset.value,
  }));
  const titleProps = useAnimatedProps(() => ({
    opacity: titleOpacity.value,
  }));
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const lastGlyph = WORDMARK_GLYPHS.length - 1;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, containerStyle]}
    >
      <Svg
        width={DISPLAY_WIDTH}
        height={DISPLAY_HEIGHT}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      >
        {/* Symbole centré dans la boîte de 232 px du lockup. */}
        <G transform="translate(56 0)">
          <G
            fill="none"
            strokeWidth={26}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(9.27 -7.08) scale(0.9615)"
          >
            <AnimatedPath
              d="M202 48H100A80 80 0 0 0 100 208"
              stroke={WorkoutTheme.text.primary}
              strokeDasharray={[ARC_LENGTH, ARC_LENGTH]}
              animatedProps={arcProps}
            />
            <AnimatedPath
              d="M105.4 143.7L156.3 143.7L156.3 194.6"
              stroke={WorkoutTheme.accent.purple}
              strokeDasharray={[CHEVRON_LENGTH, CHEVRON_LENGTH]}
              animatedProps={chevronAProps}
            />
            <AnimatedPath
              d="M142.2 106.9L193.1 106.9L193.1 157.8"
              stroke={WorkoutTheme.accent.purple}
              strokeDasharray={[CHEVRON_LENGTH, CHEVRON_LENGTH]}
              animatedProps={chevronBProps}
            />
          </G>
        </G>

        {/* Titre « GRINTA. » : le point final est en accent. */}
        <AnimatedG transform="translate(20 312)" animatedProps={titleProps}>
          {WORDMARK_GLYPHS.map((d, i) => (
            <Path
              key={i}
              d={d}
              fill={
                i === lastGlyph
                  ? WorkoutTheme.accent.purple
                  : WorkoutTheme.text.primary
              }
            />
          ))}
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}

// Le fond est celui de l'écran parent (ScreenBackground) : pas de couleur ici.
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
