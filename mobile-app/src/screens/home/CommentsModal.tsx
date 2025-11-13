import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/tokens';

interface Comment {
    id: string;
    author: {
        id: string;
        name: string;
        avatarUrl: string;
    };
    text: string;
    timestamp: string;
}

interface CommentsModalProps {
    visible: boolean;
    postId: string;
    onClose: () => void;
    onAddComment: (postId: string, text: string) => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
    visible,
    postId,
    onClose,
    onAddComment,
}) => {
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<Comment[]>([
        // Mock comments for UI
        {
            id: '1',
            author: {
                id: 'user1',
                name: 'User 1',
                avatarUrl: 'https://via.placeholder.com/40',
            },
            text: 'This is a great post!',
            timestamp: '2 hours ago',
        },
        {
            id: '2',
            author: {
                id: 'user2',
                name: 'User 2',
                avatarUrl: 'https://via.placeholder.com/40',
            },
            text: 'Thanks for sharing!',
            timestamp: '1 hour ago',
        },
    ]);

    const handleAddComment = () => {
        if (commentText.trim()) {
            // Add to local state
            const newComment: Comment = {
                id: `comment-${Date.now()}`,
                author: {
                    id: 'currentUser',
                    name: 'Current User',
                    avatarUrl: 'https://via.placeholder.com/40',
                },
                text: commentText,
                timestamp: 'Just now',
            };

            setComments(prev => [newComment, ...prev]);

            // Call parent handler
            onAddComment(postId, commentText);

            // Clear input
            setCommentText('');
        }
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={styles.commentContainer}>
            <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{item.author.name}</Text>
                <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
            </View>
            <Text style={styles.commentText}>{item.text}</Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Comments</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Comments list */}
                <FlatList
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.commentsList}
                    inverted
                />

                {/* Input area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a comment..."
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                        onPress={handleAddComment}
                        disabled={!commentText.trim()}
                    >
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cardBackground,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60,
        backgroundColor: colors.gradStart,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.accentInactive,
    },
    headerTitle: {
        fontSize: fontSize.body,
        color: colors.primaryText,
    },
    closeButton: {
        padding: spacing.sm,
    },
    closeButtonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
    },
    commentsList: {
        padding: spacing.lg,
    },
    commentContainer: {
        marginBottom: spacing.lg,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    commentAuthor: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        },
    commentTimestamp: {
        fontSize: fontSize.caption,
        color: colors.secondaryText,
    },
    commentText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.accentInactive,
    },
    input: {
        flex: 1,
        fontSize: fontSize.body,
        color: colors.primaryText,
        borderWidth: 1,
        borderColor: colors.accentInactive,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginRight: spacing.md,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: colors.gradStart,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        },
});

export default CommentsModal;






