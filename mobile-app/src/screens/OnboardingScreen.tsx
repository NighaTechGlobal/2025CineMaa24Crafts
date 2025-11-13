import React from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingCarousel from '../components/OnboardingCarousel';
import { colors } from '../styles/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Welcome: undefined;
    Login: undefined;
    ArtistSignup: undefined;
    RecruiterSignup: undefined;
    Main: undefined;
};

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation<OnboardingScreenNavigationProp>();

    console.log('OnboardingScreen rendered');

    const onboardingCards = [
        {
            id: 1,
            title: '',
            subtitle: '',
            image: require('../../assets/splashCard1.jpg'),
        },
        {
            id: 2,
            title: '',
            subtitle: '',
            image: require('../../assets/splashCard2.jpg'),
        },
        {
            id: 3,
            title: '',
            subtitle: '',
            image: require('../../assets/splashCard3.jpg'),
        },
    ];

    const handleDone = async () => {
        try {
            await AsyncStorage.setItem('@has_seen_onboarding', 'true');
        } catch {}
        navigation.replace('Welcome');
    };

    return (
        <View style={styles.container}>
            <OnboardingCarousel cards={onboardingCards} onDone={handleDone} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});

export default OnboardingScreen;






