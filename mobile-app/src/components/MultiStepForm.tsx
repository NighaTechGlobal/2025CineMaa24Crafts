import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../styles/tokens';
import ImageUploader from './ImageUploader';

interface MultiStepFormProps {
    steps: number;
    userType: 'artist' | 'recruiter';
    onComplete: () => void;
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({
    steps,
    userType,
    onComplete,
}) => {
    const [currentStep, setCurrentStep] = useState(1);

    const handleNext = () => {
        if (currentStep < steps) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>
                            {userType === 'artist' ? 'Artist Profile' : 'Recruiter Profile'}
                        </Text>
                        <Text style={styles.stepDescription}>
                            Tell us about yourself
                        </Text>
                        <ImageUploader onChange={(url: string) => {
                            // Handle image upload
                            console.log('Image uploaded:', url);
                        }} />
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>
                            {userType === 'artist' ? 'Artistic Skills' : 'Company Details'}
                        </Text>
                        <Text style={styles.stepDescription}>
                            Share your expertise
                        </Text>
                    </View>
                );
            case 3:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>
                            {userType === 'artist' ? 'Portfolio' : 'Job Preferences'}
                        </Text>
                        <Text style={styles.stepDescription}>
                            Showcase your work
                        </Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
                {Array.from({ length: steps }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.stepDot,
                            index + 1 === currentStep && styles.activeStepDot,
                        ]}
                    />
                ))}
            </View>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <View style={styles.navigation}>
                {currentStep > 1 && (
                    <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                        <Text style={styles.navButtonText}>Back</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.navButton, styles.nextButton]}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {currentStep === steps ? 'Finish' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: spacing.lg,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: spacing.xxl,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.accentInactive,
        marginHorizontal: spacing.sm,
    },
    activeStepDot: {
        backgroundColor: colors.accentActive,
        transform: [{ scale: 1.2 }],
    },
    stepContent: {
        marginBottom: spacing.xxl,
    },
    stepTitle: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    stepDescription: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    navButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    navButtonText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    nextButton: {
        backgroundColor: colors.gradStart,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.xl,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    nextButtonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        },
});

export default MultiStepForm;




