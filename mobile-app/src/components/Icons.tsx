import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../styles/tokens';

// Simple icon components using vector shapes
export const MenuIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.menuIcon} />
    </View>
);

export const MessageIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.messageIcon} />
    </View>
);

export const HomeIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.homeIcon} />
    </View>
);

export const MembersIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.membersIcon} />
    </View>
);

export const SchedulesIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.schedulesIcon} />
    </View>
);

export const ProjectsIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.projectsIcon} />
    </View>
);

export const ProfileIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.profileIcon} />
    </View>
);

export const SearchIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.searchIcon} />
    </View>
);

export const BookmarkIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.bookmarkIcon} />
    </View>
);

export const LikeIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.likeIcon} />
    </View>
);

export const CommentIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.commentIcon} />
    </View>
);

export const ShareIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.shareIcon} />
    </View>
);

export const MoreIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.moreIcon} />
    </View>
);

const styles = StyleSheet.create({
    iconContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuIcon: {
        width: 20,
        height: 2,
        backgroundColor: colors.primaryText,
        position: 'relative',
    },
    messageIcon: {
        width: 20,
        height: 16,
        borderRadius: 2,
        borderWidth: 2,
        borderColor: colors.primaryText,
        position: 'relative',
    },
    homeIcon: {
        width: 20,
        height: 18,
        borderBottomWidth: 2,
        borderBottomColor: colors.primaryText,
        borderLeftWidth: 2,
        borderLeftColor: colors.primaryText,
        borderRightWidth: 2,
        borderRightColor: colors.primaryText,
        borderTopWidth: 2,
        borderTopColor: colors.primaryText,
    },
    membersIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primaryText,
    },
    schedulesIcon: {
        width: 18,
        height: 18,
        borderRadius: 2,
        borderWidth: 2,
        borderColor: colors.primaryText,
    },
    projectsIcon: {
        width: 20,
        height: 16,
        borderBottomWidth: 2,
        borderBottomColor: colors.primaryText,
        borderLeftWidth: 2,
        borderLeftColor: colors.primaryText,
        borderRightWidth: 2,
        borderRightColor: colors.primaryText,
    },
    profileIcon: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: colors.primaryText,
    },
    searchIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.primaryText,
        transform: [{ rotate: '45deg' }],
    },
    bookmarkIcon: {
        width: 16,
        height: 20,
        backgroundColor: colors.primaryText,
    },
    likeIcon: {
        width: 18,
        height: 16,
        backgroundColor: colors.primaryText,
        transform: [{ rotate: '45deg' }],
    },
    commentIcon: {
        width: 18,
        height: 16,
        borderWidth: 2,
        borderColor: colors.primaryText,
        position: 'relative',
    },
    shareIcon: {
        width: 18,
        height: 18,
        borderLeftWidth: 2,
        borderLeftColor: colors.primaryText,
        borderBottomWidth: 2,
        borderBottomColor: colors.primaryText,
        transform: [{ rotate: '45deg' }],
    },
    moreIcon: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.primaryText,
        marginBottom: 4,
    },
});




