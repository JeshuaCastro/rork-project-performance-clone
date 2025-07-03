import React from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, Text, View, ScrollView } from "react-native";
import { colors } from "@/constants/colors";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>About WHOOP AI Coach</Text>
        
        <Text style={styles.sectionTitle}>What is WHOOP?</Text>
        <Text style={styles.text}>
          WHOOP is a wearable fitness tracker that monitors your recovery, strain, and sleep. 
          It provides detailed metrics about your body's performance and helps you optimize your training.
        </Text>
        
        <Text style={styles.sectionTitle}>How AI Coach Works</Text>
        <Text style={styles.text}>
          Our AI Coach analyzes your WHOOP data to provide personalized recommendations for training, 
          recovery, and sleep. It uses advanced algorithms to identify patterns and suggest optimal 
          strategies for improving your performance.
        </Text>
        
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        
        <Text style={styles.metricTitle}>Recovery</Text>
        <Text style={styles.text}>
          Recovery score indicates how prepared your body is for strain. It's based on HRV, 
          resting heart rate, and sleep performance.
        </Text>
        
        <Text style={styles.metricTitle}>Strain</Text>
        <Text style={styles.text}>
          Strain measures the cardiovascular load on your body throughout the day. 
          It ranges from 0-21, with higher numbers indicating more strain.
        </Text>
        
        <Text style={styles.metricTitle}>Sleep</Text>
        <Text style={styles.text}>
          Sleep performance tracks the quality and quantity of your sleep, including 
          time spent in different sleep stages and disturbances.
        </Text>
        
        <Text style={styles.disclaimer}>
          Note: This is a demo application. In a real implementation, this would connect 
          to the actual WHOOP API to retrieve your personal data.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.secondary,
    marginTop: 16,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 12,
    fontStyle: "italic",
    color: colors.textSecondary,
    marginTop: 30,
    marginBottom: 20,
  },
});