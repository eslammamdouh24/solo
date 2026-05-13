import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");

interface ParticleEffectProps {
  visible: boolean;
  particleCount?: number;
  colors?: string[];
  duration?: number;
}

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  visible,
  particleCount = 30,
  colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7", "#F59E0B"],
  duration = 2000,
}) => {
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    // Initialize particles
    particles.current = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 150;
      const startX = width / 2;
      const startY = height / 2;

      return {
        x: new Animated.Value(startX),
        y: new Animated.Value(startY),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        rotate: new Animated.Value(0),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
      };
    });
  }, []);

  useEffect(() => {
    if (visible) {
      // Animate all particles
      particles.current.forEach((particle) => {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 150;
        const startX = width / 2;
        const startY = height / 2;

        // Reset particle position
        particle.x.setValue(startX);
        particle.y.setValue(startY);
        particle.opacity.setValue(1);
        particle.scale.setValue(1);
        particle.rotate.setValue(0);

        Animated.parallel([
          Animated.timing(particle.x, {
            toValue: startX + Math.cos(angle) * velocity,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue:
              startY + Math.sin(angle) * velocity + Math.random() * 100 + 50,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: 1.5,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotate, {
            toValue: (Math.random() - 0.5) * 720,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible, duration]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
                {
                  rotate: particle.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  particle: {
    position: "absolute",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
