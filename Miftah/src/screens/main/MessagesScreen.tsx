import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  I18nManager,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { Audio } from 'expo-av';
import { GlassContainer } from '../../components/GlassContainer';
import { CustomButton } from '../../components/CustomButton';
import { MessagingService } from '../../services/messaging';
import { lightTheme, darkTheme } from '../../theme';
import { Message, MessageType, User, Conversation } from '../../types';

const { width, height } = Dimensions.get('window');

interface MessagesScreenProps {
  navigation: any;
  route: {
    params: {
      conversation: Conversation;
      user: User;
      otherUser: User;
    };
  };
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  navigation,
  route,
}) => {
  const { conversation, user, otherUser } = route.params;
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = I18nManager.isRTL;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Subscribe to messages
    const unsubscribe = MessagingService.subscribeToConversation(
      conversation.id,
      (newMessages) => {
        setMessages(newMessages);
        scrollToBottom();
      }
    );

    // Load smart replies
    loadSmartReplies();

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const loadSmartReplies = async () => {
    // Load contextual quick replies
    const replies = [
      t('thanks'),
      t('soundsGood'),
      t('interested'),
      t('bestPrice'),
      t('canWeMeet'),
      t('stillAvailable'),
    ];
    setQuickReplies(replies);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async (text: string = inputText, type: MessageType = MessageType.TEXT) => {
    if (!text.trim() && type === MessageType.TEXT) return;

    try {
      // Check moderation
      const moderation = await MessagingService.moderateMessage(text, user.id);
      
      if (!moderation.isAllowed) {
        Alert.alert(
          'Message Not Sent',
          moderation.reason,
          moderation.suggestedEdit ? [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Use Suggestion',
              onPress: () => handleSendMessage(moderation.suggestedEdit!, type)
            }
          ] : [{ text: 'OK' }]
        );
        return;
      }

      await MessagingService.sendMessage(
        conversation.id,
        user.id,
        otherUser.id,
        text,
        type
      );

      setInputText('');
      setShowQuickReplies(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);

    // Set typing indicator
    if (!isTyping) {
      setIsTyping(true);
      MessagingService.setTyping(conversation.id, user.id, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      MessagingService.setTyping(conversation.id, user.id, false);
    }, 3000);
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        // Send voice message
        await MessagingService.sendVoiceMessage(
          conversation.id,
          user.id,
          otherUser.id,
          uri,
          0 // Duration would be calculated
        );
      }

      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleSendOffer = async () => {
    if (!offerAmount.trim() || !conversation.itemId) return;

    try {
      await MessagingService.sendOfferMessage(
        conversation.id,
        user.id,
        otherUser.id,
        conversation.itemId,
        parseFloat(offerAmount)
      );

      setShowOfferModal(false);
      setOfferAmount('');
    } catch (error) {
      console.error('Error sending offer:', error);
      Alert.alert('Error', 'Failed to send offer');
    }
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    try {
      await MessagingService.addReaction(messageId, user.id, reaction);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const renderMessage = ({ item: message, index }: { item: Message; index: number }) => {
    const isOwn = message.senderId === user.id;
    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId);

    return (
      <Animatable.View
        animation={isOwn ? 'slideInRight' : 'slideInLeft'}
        delay={index * 50}
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {showAvatar && !isOwn && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {otherUser.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onLongPress={() => {
            // Show reaction options
            Alert.alert(
              'React to message',
              '',
              [
                { text: '👍', onPress: () => handleReaction(message.id, '👍') },
                { text: '❤️', onPress: () => handleReaction(message.id, '❤️') },
                { text: '😂', onPress: () => handleReaction(message.id, '😂') },
                { text: '😮', onPress: () => handleReaction(message.id, '😮') },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <GlassContainer
            style={[
              styles.messageBubble,
              isOwn ? styles.ownBubble : styles.otherBubble,
              { backgroundColor: isOwn ? theme.colors.primary + '20' : theme.colors.surface + '80' },
            ]}
          >
            {/* Offer message */}
            {message.type === MessageType.OFFER && message.offerAmount && (
              <View style={styles.offerContainer}>
                <Ionicons name="pricetag" size={16} color={theme.colors.primary} />
                <Text style={[styles.offerText, { color: theme.colors.primary }]}>
                  Offer: ${message.offerAmount}
                </Text>
              </View>
            )}

            {/* Message content */}
            <Text style={[
              styles.messageText,
              { color: isOwn ? theme.colors.surface : theme.colors.text }
            ]}>
              {message.content}
            </Text>

            {/* Translation */}
            {message.translatedContent && (
              <Text style={[
                styles.translatedText,
                { color: isOwn ? theme.colors.surface + '80' : theme.colors.textSecondary }
              ]}>
                🌐 {message.translatedContent}
              </Text>
            )}

            {/* Message info */}
            <View style={styles.messageInfo}>
              <Text style={[
                styles.messageTime,
                { color: isOwn ? theme.colors.surface + '80' : theme.colors.textSecondary }
              ]}>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>

              {isOwn && (
                <Ionicons
                  name={message.isRead ? 'checkmark-done' : 'checkmark'}
                  size={16}
                  color={message.isRead ? theme.colors.success : theme.colors.surface + '80'}
                  style={styles.readStatus}
                />
              )}

              {/* Sentiment indicator */}
              {message.sentiment && message.sentiment.label !== 'neutral' && (
                <Text style={styles.sentimentIndicator}>
                  {message.sentiment.label === 'positive' ? '😊' : '😔'}
                </Text>
              )}
            </View>

            {/* Reactions */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <View style={styles.reactionsContainer}>
                {Object.entries(message.reactions).map(([userId, reaction]) => (
                  <Text key={userId} style={styles.reaction}>
                    {reaction}
                  </Text>
                ))}
              </View>
            )}
          </GlassContainer>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const renderQuickReplies = () => {
    if (!showQuickReplies || quickReplies.length === 0) return null;

    return (
      <Animatable.View animation="slideInUp" style={styles.quickRepliesContainer}>
        <GlassContainer style={styles.quickReplies}>
          <FlatList
            horizontal
            data={quickReplies}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickReplyButton}
                onPress={() => handleSendMessage(item)}
              >
                <Text style={[styles.quickReplyText, { color: theme.colors.primary }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </GlassContainer>
      </Animatable.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;

    return (
      <Animatable.View animation="fadeIn" style={styles.typingContainer}>
        <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
          {otherUser.displayName} is typing...
        </Text>
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          style={styles.typingDots}
        >
          <Text style={[styles.typingDotsText, { color: theme.colors.primary }]}>
            •••
          </Text>
        </Animatable.View>
      </Animatable.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={theme.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <GlassContainer style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {otherUser.displayName.charAt(0).toUpperCase()}
              </Text>
              {otherUser.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={theme.colors.success}
                  style={styles.verifiedBadge}
                />
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {otherUser.displayName}
              </Text>
              <Text style={[styles.userStatus, { color: theme.colors.textSecondary }]}>
                {otherUserTyping ? 'typing...' : 'Online'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="call" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="videocam" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassContainer>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={renderTypingIndicator}
      />

      {/* Quick Replies */}
      {renderQuickReplies()}

      {/* Input Area */}
      <GlassContainer style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.inputAction}
            onPress={() => setShowQuickReplies(!showQuickReplies)}
          >
            <Ionicons
              name="happy"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.textInput,
              { color: theme.colors.text, backgroundColor: theme.colors.surface + '50' },
              isRTL && { textAlign: 'right' }
            ]}
            placeholder={t('typeMessage')}
            placeholderTextColor={theme.colors.textSecondary}
            value={inputText}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={styles.inputAction}
            onPress={() => {
              // Show attachment options
              Alert.alert(
                'Send',
                'Choose an option',
                [
                  { text: 'Photo', onPress: () => {} },
                  { text: 'Location', onPress: () => {} },
                  { text: 'Offer', onPress: () => setShowOfferModal(true) },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          {inputText.trim() ? (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleSendMessage()}
            >
              <Ionicons name="send" size={20} color={theme.colors.surface} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isRecording && { backgroundColor: theme.colors.error + '20' }
              ]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={20}
                color={isRecording ? theme.colors.error : theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {isRecording && (
          <Animatable.View animation="pulse" iterationCount="infinite" style={styles.recordingIndicator}>
            <Text style={[styles.recordingText, { color: theme.colors.error }]}>
              🔴 Recording... Release to send
            </Text>
          </Animatable.View>
        )}
      </GlassContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  userAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    padding: 8,
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 18,
    padding: 12,
  },
  ownBubble: {
    marginLeft: 50,
  },
  otherBubble: {
    marginRight: 50,
  },
  offerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    padding: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
  },
  offerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  translatedText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  readStatus: {
    marginLeft: 4,
  },
  sentimentIndicator: {
    fontSize: 12,
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reaction: {
    fontSize: 12,
    marginRight: 2,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  typingDots: {
    marginLeft: 8,
  },
  typingDotsText: {
    fontSize: 16,
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickReplies: {
    borderRadius: 20,
    paddingVertical: 8,
  },
  quickReplyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
  },
  quickReplyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputAction: {
    padding: 8,
    marginHorizontal: 4,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  recordingIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '500',
  },
});