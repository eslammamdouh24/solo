import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleProp,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from "react-native";

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  type?: "fade" | "slide" | "scale" | "fadeSlide";
}

/**
 * Animated card with fade/slide/scale animations
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  duration = 500,
  type = "fadeSlide",
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(
    new Animated.Value(type === "slide" || type === "fadeSlide" ? 30 : 0),
  ).current;
  const scale = useRef(new Animated.Value(type === "scale" ? 0.9 : 1)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    if (type === "fade" || type === "fadeSlide") {
      animations.push(
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
      );
    }

    if (type === "slide" || type === "fadeSlide") {
      animations.push(
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
        }),
      );
    }

    if (type === "scale") {
      animations.push(
        Animated.timing(scale, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
      );
    }

    Animated.parallel(animations).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: type === "slide" ? 1 : opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Animated button with press scale effect
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  style,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  return (
    <TouchableOpacity
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

interface FadeInViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
}

/**
 * Simple fade-in view
 */
export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  style,
  delay = 0,
  duration = 500,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
};

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  itemDuration?: number;
}

/**
 * Staggered list animation for multiple items
 */
export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  itemDuration = 400,
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <AnimatedCard
          key={index}
          delay={index * staggerDelay}
          duration={itemDuration}
          type="fadeSlide"
        >
          {child}
        </AnimatedCard>
      ))}
    </>
  );
};

interface PulseViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
  minScale?: number;
  maxScale?: number;
}

/**
 * Pulsing animation (useful for attention-grabbing elements)
 */
export const PulseView: React.FC<PulseViewProps> = ({
  children,
  style,
  duration = 1000,
  minScale = 1,
  maxScale = 1.05,
}) => {
  const scale = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(scale, {
        toValue: maxScale,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: minScale,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

interface ProgressBarProps {
  progress: number; // 0-1
  color: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
  duration?: number;
}

/**
 * Animated progress bar
 */
export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  backgroundColor = "rgba(0,0,0,0.1)",
  height = 8,
  animated = true,
  duration = 800,
}) => {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(width, {
        toValue: progress,
        duration,
        useNativeDriver: false,
      }).start();
    } else {
      width.setValue(progress);
    }
  }, [progress, animated]);

  const widthInterpolated = width.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        height,
        backgroundColor,
        borderRadius: height / 2,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          backgroundColor: color,
          width: widthInterpolated,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
};
