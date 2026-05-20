import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/api';
import apiRoutes from '../../src/apiRoutes';
import { appendImageToFormData } from '../../src/formDataImages';
import ImagePreviewModal from '../../components/ImagePreviewModal';
import {
  EmployeeShell,
  EmptyState,
  ScreenHeader,
  SkeletonBlock,
  employeeTheme,
} from '../../components/employee/EmployeeUI';

const filters = ['all', 'pending', 'completed', 'cancelled'];
const pageSize = 8;

const fetchAssignedBookings = async () => {
  const res = await apiClient.get(apiRoutes.EMPLOYEE.GET_ASSIGNED_BOOKINGS);
  return res.data.bookings || [];
};

const startBooking = async (bookingId) => {
  const res = await apiClient.patch(`${apiRoutes.EMPLOYEE.START_BOOKING}/${bookingId}`);
  return res.data;
};

const completeBooking = async ({ bookingId, finalAmount, paymentMethod, afterImages }) => {
  const formData = new FormData();
  formData.append('finalAmount', finalAmount);
  formData.append('paymentMethod', paymentMethod);

  for (let i = 0; i < afterImages.length; i++) {
    await appendImageToFormData(formData, 'afterImages', afterImages[i], i, 'after_work');
  }

  const res = await apiClient.patch(`${apiRoutes.EMPLOYEE.COMPLETE_BOOKING}/${bookingId}`, formData);
  return res.data;
};

export default function EmployeeBookings() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [afterImages, setAfterImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  const { data: bookings = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['employee-bookings'],
    queryFn: fetchAssignedBookings,
  });

  const invalidateBookings = () => queryClient.invalidateQueries({ queryKey: ['employee-bookings'] });

  const startMutation = useMutation({
    mutationFn: startBooking,
    onSuccess: invalidateBookings,
    onError: (error) => {
      Alert.alert('Start Failed', error?.response?.data?.message || 'Unable to start booking.');
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeBooking,
    onSuccess: () => {
      resetCompleteForm();
      invalidateBookings();
    },
    onError: (error) => {
      Alert.alert('Completion Failed', error?.response?.data?.message || 'Unable to complete booking.');
    },
  });

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const searchable = [
        booking.customerName,
        booking.phone,
        booking.vehicleName,
        booking.vehicleNumber,
        booking.vehicleBrand?.brandName,
        booking.description,
        booking.complaintType,
      ].filter(Boolean).join(' ').toLowerCase();

      const normalizedStatus = booking.status === 'assigned' || booking.status === 'in_progress' ? 'pending' : booking.status;
      const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
      const matchesSearch = !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, query, statusFilter]);

  const visibleBookings = filteredBookings.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredBookings.length;

  const handleFilter = (filter) => {
    setStatusFilter(filter);
    setVisibleCount(pageSize);
  };

  const resetCompleteForm = () => {
    setCompleteTarget(null);
    setFinalAmount('');
    setPaymentMethod('cash');
    setAfterImages([]);
  };

  const openCompleteModal = (booking) => {
    setCompleteTarget(booking);
    setFinalAmount(String(booking.finalAmount || booking.estimateAmount || ''));
    setPaymentMethod(booking.paymentMethod || 'cash');
    setAfterImages([]);
  };

  const pickAfterImages = async () => {
    if (afterImages.length >= 2) {
      Alert.alert('Limit Reached', 'Only 2 after-work images are allowed.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permission is required to upload proof images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 2 - afterImages.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      setAfterImages((current) => [...current, ...result.assets].slice(0, 2));
    }
  };

  const removeAfterImage = (index) => {
    setAfterImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleComplete = () => {
    if (!completeTarget?._id) return;
    if (!finalAmount || Number.isNaN(Number(finalAmount))) {
      Alert.alert('Final Amount Required', 'Enter a valid final amount.');
      return;
    }
    if (afterImages.length !== 2) {
      Alert.alert('Images Required', 'Please upload exactly 2 after-work images.');
      return;
    }
    if (!['cash', 'online'].includes(paymentMethod)) {
      Alert.alert('Payment Method Required', 'Select cash or online payment.');
      return;
    }

    completeMutation.mutate({
      bookingId: completeTarget._id,
      finalAmount,
      paymentMethod,
      afterImages,
    });
  };

  return (
    <EmployeeShell contentStyle={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: 24 }}>
        <ScreenHeader
          title="Bookings"
          subtitle="Search assigned jobs, filter by status, and review service/payment details."
          action={
            <TouchableOpacity
              onPress={refetch}
              style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: employeeTheme.panelStrong, borderWidth: 1, borderColor: employeeTheme.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="refresh-cw" size={18} color={employeeTheme.accent} />
            </TouchableOpacity>
          }
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 16, backgroundColor: employeeTheme.panelStrong, borderWidth: 1, borderColor: employeeTheme.border, paddingHorizontal: 16, marginBottom: 14 }}>
          <Feather name="search" size={18} color={employeeTheme.faint} />
          <TextInput
            style={{ flex: 1, color: employeeTheme.text, fontSize: 14, marginLeft: 12 }}
            placeholder="Search customer, service or vehicle"
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Feather name="x" size={17} color={employeeTheme.faint} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingBottom: 18 }}>
        {filters.map((filter) => {
          const selected = statusFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => handleFilter(filter)}
              style={{
                paddingHorizontal: 16,
                height: 38,
                borderRadius: 13,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? 'rgba(139,92,246,0.2)' : employeeTheme.panelStrong,
                borderWidth: 1,
                borderColor: selected ? 'rgba(139,92,246,0.42)' : employeeTheme.border,
              }}
            >
              <Text style={{ color: selected ? employeeTheme.accent : employeeTheme.muted, fontSize: 13, fontWeight: '800', textTransform: 'capitalize' }}>{filter}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 24 }}>
        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3, 4].map((item) => <SkeletonBlock key={item} height={148} />)}
          </View>
        ) : isError ? (
          <EmptyState
            icon="wifi-off"
            title="Could not load bookings"
            message="Check that the backend employee booking route is running, then retry."
            actionLabel="Retry"
            onAction={refetch}
          />
        ) : visibleBookings.length ? (
          <>
            <Text style={{ color: employeeTheme.muted, fontSize: 12, fontWeight: '700', marginBottom: 12 }}>
              {filteredBookings.length} booking{filteredBookings.length === 1 ? '' : 's'} found
            </Text>
            {visibleBookings.map((booking) => (
              <EmployeeBookingCard
                key={booking._id}
                booking={booking}
                onStart={() => startMutation.mutate(booking._id)}
                onComplete={() => openCompleteModal(booking)}
                onPreviewImage={(url, title) => setPreviewImage({ url, title })}
                isStarting={startMutation.isPending}
              />
            ))}
            {canLoadMore ? (
              <TouchableOpacity
                onPress={() => setVisibleCount((count) => count + pageSize)}
                style={{ height: 52, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.28)', backgroundColor: 'rgba(139,92,246,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
              >
                <Text style={{ color: employeeTheme.accent, fontWeight: '800' }}>Load more</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon="search"
            title="No bookings found"
            message="Try a different search term or switch the status filter."
            actionLabel="Clear filters"
            onAction={() => {
              setQuery('');
              handleFilter('all');
            }}
          />
        )}
      </View>

      <CompleteBookingModal
        visible={!!completeTarget}
        booking={completeTarget}
        finalAmount={finalAmount}
        setFinalAmount={setFinalAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        afterImages={afterImages}
        pickAfterImages={pickAfterImages}
        removeAfterImage={removeAfterImage}
        onClose={resetCompleteForm}
        onSubmit={handleComplete}
        isSubmitting={completeMutation.isPending}
      />

      <ImagePreviewModal
        visible={!!previewImage}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)}
      />
    </EmployeeShell>
  );
}

function EmployeeBookingCard({ booking, onStart, onComplete, onPreviewImage, isStarting }) {
  const createdAt = booking?.createdAt ? new Date(booking.createdAt) : null;
  const dateLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not scheduled';
  const timeLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '--';
  const canStart = booking.status === 'assigned' || booking.status === 'pending';
  const afterImageCount = booking.afterImages?.length || 0;
  const canSubmitAfterWork = booking.status !== 'completed' && afterImageCount < 2;

  return (
    <View style={{ backgroundColor: employeeTheme.panel, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: employeeTheme.border, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: employeeTheme.text, fontSize: 16, fontWeight: '800' }}>{booking.customerName || 'Customer'}</Text>
          <Text numberOfLines={1} style={{ color: employeeTheme.accent, fontSize: 13, fontWeight: '700', marginTop: 4 }}>{booking.description || booking.complaintType || 'Service booking'}</Text>
        </View>
        <StatusLabel status={booking.status} />
      </View>

      <View style={{ marginTop: 14, gap: 10 }}>
        <MetaRow icon="truck" label="Vehicle" value={`${booking.vehicleBrand?.brandName ? `${booking.vehicleBrand.brandName} ` : ''}${booking.vehicleName || 'Vehicle'}${booking.vehicleNumber ? ` • ${booking.vehicleNumber}` : ''}`} />
        <MetaRow icon="calendar" label="Date & time" value={`${dateLabel} • ${timeLabel}`} />
        <MetaRow icon="credit-card" label="Payment" value={booking.finalAmount ? `Final • ₹${booking.finalAmount}${booking.paymentMethod ? ` • ${booking.paymentMethod}` : ''}` : `Estimate • ₹${booking.estimateAmount || 0}`} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        {canStart ? (
          <TouchableOpacity
            onPress={onStart}
            disabled={isStarting}
            style={{ flex: 1, height: 46, borderRadius: 15, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.28)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}
          >
            <Feather name="play" size={15} color={employeeTheme.accent} />
            <Text style={{ color: employeeTheme.accent, fontSize: 13, fontWeight: '900' }}>{isStarting ? 'Starting...' : 'Start'}</Text>
          </TouchableOpacity>
        ) : null}

        {canSubmitAfterWork ? (
          <TouchableOpacity
            onPress={onComplete}
            style={{ flex: 1, height: 46, borderRadius: 15, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}
          >
            <Feather name="upload-cloud" size={15} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>Submit proof</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <BookingImageStrip
        title="Before Work"
        images={booking.beforeImages || []}
        emptyText="No before images"
        onPreview={(url, index) => onPreviewImage(url, `Before work image ${index + 1}`)}
      />

      <BookingImageStrip
        title="After Work"
        images={booking.afterImages || []}
        emptyText="After images not uploaded"
        onPreview={(url, index) => onPreviewImage(url, `After work image ${index + 1}`)}
      />
    </View>
  );
}

function BookingImageStrip({ title, images, emptyText, onPreview }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: employeeTheme.faint, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>{title}</Text>
      {images.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((uri, index) => (
            <TouchableOpacity key={`${uri}-${index}`} onPress={() => onPreview(uri, index)} style={{ marginRight: 8 }}>
              <Image
                source={{ uri }}
                style={{ width: 64, height: 64, borderRadius: 13, backgroundColor: employeeTheme.panelStrong, borderWidth: 1, borderColor: employeeTheme.border }}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={{ padding: 11, borderRadius: 13, backgroundColor: employeeTheme.panelStrong, borderWidth: 1, borderColor: employeeTheme.border }}>
          <Text style={{ color: employeeTheme.muted, fontSize: 12 }}>{emptyText}</Text>
        </View>
      )}
    </View>
  );
}

function CompleteBookingModal({
  visible,
  booking,
  finalAmount,
  setFinalAmount,
  paymentMethod,
  setPaymentMethod,
  afterImages,
  pickAfterImages,
  removeAfterImage,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{ backgroundColor: '#1a0533', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 34, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)', alignSelf: 'center', marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: employeeTheme.text, fontSize: 22, fontWeight: '900' }}>Complete booking</Text>
                <Text numberOfLines={1} style={{ color: employeeTheme.muted, fontSize: 13, marginTop: 5 }}>{booking?.vehicleName || 'Vehicle'} • {booking?.customerName || 'Customer'}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: employeeTheme.panelStrong, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="x" size={18} color={employeeTheme.muted} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: employeeTheme.faint, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Final amount</Text>
              <View style={{ height: 54, borderRadius: 16, backgroundColor: employeeTheme.panelStrong, borderWidth: 1, borderColor: employeeTheme.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
                <Feather name="credit-card" size={17} color={employeeTheme.muted} />
                <TextInput
                  value={finalAmount}
                  onChangeText={setFinalAmount}
                  keyboardType="numeric"
                  placeholder="Enter final amount"
                  placeholderTextColor="rgba(255,255,255,0.26)"
                  style={{ flex: 1, color: employeeTheme.text, fontSize: 15, marginLeft: 12 }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: employeeTheme.faint, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Payment method</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['cash', 'online'].map((method) => {
                  const selected = paymentMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      onPress={() => setPaymentMethod(method)}
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 8,
                        backgroundColor: selected ? 'rgba(139,92,246,0.22)' : employeeTheme.panelStrong,
                        borderWidth: 1,
                        borderColor: selected ? 'rgba(139,92,246,0.45)' : employeeTheme.border,
                      }}
                    >
                      <Feather name={method === 'cash' ? 'dollar-sign' : 'smartphone'} size={16} color={selected ? employeeTheme.accent : employeeTheme.muted} />
                      <Text style={{ color: selected ? employeeTheme.accent : employeeTheme.muted, fontSize: 13, fontWeight: '900', textTransform: 'capitalize' }}>{method}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: employeeTheme.faint, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>After Work Images ({afterImages.length}/2)</Text>
                <Text style={{ color: employeeTheme.accent, fontSize: 10, fontWeight: '800' }}>Exactly 2 required</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                {afterImages.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={{ width: 86, height: 86, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: employeeTheme.border }}>
                    <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    <TouchableOpacity onPress={() => removeAfterImage(index)} style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="x" size={13} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {afterImages.length < 2 ? (
                  <TouchableOpacity
                    onPress={pickAfterImages}
                    style={{ width: 86, height: 86, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Feather name="camera" size={24} color={employeeTheme.accent} />
                    <Text style={{ color: employeeTheme.accent, fontSize: 10, marginTop: 5, fontWeight: '800' }}>Add</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <TouchableOpacity onPress={onSubmit} disabled={isSubmitting}>
              <View style={{ height: 56, borderRadius: 18, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: isSubmitting ? 0.65 : 1 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>{isSubmitting ? 'Uploading...' : 'Upload proof & complete'}</Text>
                {!isSubmitting ? <Feather name="upload-cloud" size={18} color="#fff" /> : null}
              </View>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function MetaRow({ icon, label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', marginRight: 10 }}>
        <Feather name={icon} size={14} color={employeeTheme.muted} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: employeeTheme.faint, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.76)', fontSize: 13, fontWeight: '600', marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

function StatusLabel({ status }) {
  const normalized = status || 'pending';
  const config =
    normalized === 'completed'
      ? { color: employeeTheme.success, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)' }
      : normalized === 'in_progress'
        ? { color: employeeTheme.accent, bg: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.24)' }
        : { color: employeeTheme.warning, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };

  return (
    <View style={{ backgroundColor: config.bg, borderWidth: 1, borderColor: config.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 }}>
      <Text style={{ color: config.color, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 }}>{normalized.replace('_', ' ')}</Text>
    </View>
  );
}
