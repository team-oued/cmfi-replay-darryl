import React, { useState, useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { MediaContent, MediaType } from '../types';
import { PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useAppContext } from '../context/AppContext';

interface EventSliderProps {
  items: MediaContent[];
  onSelectMedia: (item: MediaContent) => void;
  onPlay: (item: MediaContent) => void;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.9;
const ITEM_MARGIN = width * 0.02;
const ITEM_HEIGHT = width * 0.6;

const EventSlider: React.FC<EventSliderProps> = ({ items, onSelectMedia, onPlay }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { t, theme } = useAppContext();
  const flatListRef = useRef<any>(null);

  // Auto-scroll functionality
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % items.length;
      scrollToIndex(nextIndex);
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, items.length]);

  const scrollToIndex = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
      setCurrentIndex(index);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / (ITEM_WIDTH + ITEM_MARGIN * 2));
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const renderItem = ({ item, index }: { item: MediaContent; index: number }) => {
    const inputRange = [
      (index - 1) * (ITEM_WIDTH + ITEM_MARGIN * 2),
      index * (ITEM_WIDTH + ITEM_MARGIN * 2),
      (index + 1) * (ITEM_WIDTH + ITEM_MARGIN * 2),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.slide,
          {
            width: ITEM_WIDTH,
            height: ITEM_HEIGHT,
            marginHorizontal: ITEM_MARGIN,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onSelectMedia(item)}
          style={styles.imageContainer}
        >
          <Animated.Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.playButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onPlay(item);
                  }}
                >
                  <PlayIcon size={20} color="#fff" />
                  <Text style={styles.buttonText}>{t('play') || 'Regarder'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.infoButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onSelectMedia(item);
                  }}
                >
                  <Text style={styles.buttonText}>{t('details') || 'Détails'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={ITEM_WIDTH + ITEM_MARGIN * 2}
        decelerationRate="fast"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={0}
        getItemLayout={(data, index) => ({
          length: ITEM_WIDTH + ITEM_MARGIN * 2,
          offset: (ITEM_WIDTH + ITEM_MARGIN * 2) * index,
          index,
        })}
      />

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => {
            const prevIndex = (currentIndex - 1 + items.length) % items.length;
            scrollToIndex(prevIndex);
          }}
          style={styles.controlButton}
        >
          <ChevronLeftIcon size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsPaused(!isPaused)}
          style={styles.controlButton}
        >
          {isPaused ? (
            <PlayIcon size={24} color="#fff" />
          ) : (
            <PauseIcon size={24} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const nextIndex = (currentIndex + 1) % items.length;
            scrollToIndex(nextIndex);
          }}
          style={styles.controlButton}
        >
          <ChevronRightIcon size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.pagination}>
        {items.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  listContent: {
    paddingHorizontal: ITEM_MARGIN,
  },
  slide: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  content: {
    maxWidth: '80%',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  playButton: {
    backgroundColor: '#E50914',
  },
  infoButton: {
    backgroundColor: 'rgba(109, 109, 110, 0.7)',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  controlButton: {
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#E50914',
  },
});

export default EventSlider;
