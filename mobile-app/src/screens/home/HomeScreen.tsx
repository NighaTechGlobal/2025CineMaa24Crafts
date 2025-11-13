import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../styles/tokens';
import { ArtistHomeScreen, RecruiterHomeScreen } from './index';
import { getUser } from '../../services/authStorage';
import { getAuthProfile } from '../../services/api';
import { logger } from '../../utils/logger';

const HomeScreen: React.FC = () => {
    const [userRole, setUserRole] = useState<'artist' | 'recruiter' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserRole();
    }, []);

    const loadUserRole = async () => {
        try {
            const user = await getUser();
            logger.debug('🔍 HomeScreen: User role from storage:', user?.role);
            logger.debug('🔍 HomeScreen: User data:', JSON.stringify(user, null, 2));

            // First try local storage role
            let role: any = user?.role;

            // If missing/invalid, fetch from auth profile as authoritative source
            if (role !== 'artist' && role !== 'recruiter') {
                try {
                    const response = await getAuthProfile();
                    const profileRole = response?.profile?.role;
                    logger.debug('🔍 HomeScreen: Role from getAuthProfile:', profileRole);
                    role = profileRole;
                } catch (profileErr) {
                    logger.warn('HomeScreen: Failed to load role from profile, falling back to artist', profileErr);
                }
            }

            if (role === 'artist' || role === 'recruiter') {
                setUserRole(role);
            } else {
                setUserRole('artist'); // Safe default
            }
        } catch (error) {
            logger.error('Error loading user role:', error);
            setUserRole('artist'); // Default to artist
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {userRole === 'recruiter' ? <RecruiterHomeScreen /> : <ArtistHomeScreen />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default HomeScreen;






