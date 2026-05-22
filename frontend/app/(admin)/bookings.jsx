import { View, Text, ScrollView, TouchableOpacity, TextInput, LayoutAnimation, Platform, UIManager, Modal, Pressable, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../src/api';
import apiRoutes from '../../src/apiRoutes';
import { appendImageToFormData } from '../../src/formDataImages';
import { useMutation, useQuery } from '@tanstack/react-query';
import ToastComponent from '../../components/ToastComponent';
import ImagePreviewModal from '../../components/ImagePreviewModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


const addBooking = async ({
  vehicleName,
  vehicleNum,
  customerName,
  customerNum,
  selectedBrand,
  complaintType,
  works,
  selectedImages,
  selectedEmployee,
  estimateAmount
}) => {
  try {
    const formData = new FormData();

    formData.append("customerName", customerName);
    formData.append("phone", customerNum);
    formData.append("vehicleBrand", selectedBrand);
    formData.append("vehicleName", vehicleName);
    formData.append("vehicleNumber", vehicleNum);
    formData.append("complaintType", complaintType);
    formData.append("description", works);
    formData.append("estimateAmount", estimateAmount);

    if (selectedEmployee) {
      formData.append("assignedTo", selectedEmployee?._id);
    }

    // Images
    for (let i = 0; i < selectedImages.length; i++) {
      await appendImageToFormData(formData, "beforeImages", selectedImages[i], i, "before_work");
    }

    const res = await apiClient.post(apiRoutes.ADMIN.CREATE_BOOKING, formData);

    return res.data;

  } catch (err) {
    console.log(err?.response?.data || err.message);
    throw err;
  }
};

export default function BookingsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [openId, setOpenId] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const insets = useSafeAreaInsets();

  // Form State
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNum, setVehicleNum] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNum, setCustomerNum] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [complaintType, setComplaintType] = useState('Low'); // Major, Minor, Low
  const [works, setWorks] = useState('');
  const [estimateAmount, setEstimateAmount] = useState('');
  const [time, setTime] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);

  const { mutate, isPending } = useMutation({
    mutationFn: addBooking,
    onSuccess: (data) => {
      console.log(data)
      resetForm()
      setIsAddModalVisible(false)
      refetchBookings()
    },
    onError: (err) => {
      console.log(err)
      ToastComponent("Error", err?.response?.data?.message || "Failed to create booking");
    }
  })

  // Modal States for Selection
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  // Queries
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await apiClient.get(apiRoutes.ADMIN.GET_BRANDS);
      return res.data.brands;
    }
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get(apiRoutes.ADMIN.GET_EMPLOYEES);
      return res.data.employees;
    }
  });

  const { data: bookingsList, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await apiClient.get(apiRoutes.ADMIN.GET_ALL_BOOKINGS);
      return res.data.bookings;
    }
  });

  const statuses = ['All', 'Pending', 'Assigned', 'In Progress', 'Completed'];

  const filteredBookings = (bookingsList || []).filter(booking => {
    const matchesSearch =
      (booking.vehicleName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'All' ||
      (booking.status || '').toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
      case 'assigned': return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' };
      case 'in_progress': return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' };
      case 'completed': return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' };
      default: return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
    }
  };

  const toggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(prev => (prev === id ? null : id));
  };

  const pickImage = async () => {
    if (selectedImages.length >= 2) {
      Alert.alert("Limit Reached", "You can only upload up to 2 images per booking.");
      return;
    }

    // Permission check
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 2 - selectedImages.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const totalImages = [...selectedImages, ...result.assets].slice(0, 2);

      setSelectedImages(totalImages);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setVehicleName('');
    setVehicleNum('');
    setCustomerName('');
    setCustomerNum('');
    setSelectedBrand('');
    setSelectedEmployee(null);
    setComplaintType('Low');
    setWorks('');
    setTime('');
    setSelectedImages([]);
    setIsBrandModalOpen(false);
    setIsEmployeeModalOpen(false);
  };

  const handleCreateBooking = () => {
    const phoneRegex = /^[0-9]{10}$/;
    
    if (!vehicleName.trim()) {
      ToastComponent("Error", "Please enter vehicle name.");
      return;
    }
    if (!vehicleNum.trim()) {
      ToastComponent("Error", "Please enter vehicle number.");
      return;
    }
    if (!customerName.trim()) {
      ToastComponent("Error", "Please enter customer name.");
      return;
    }
    if (!customerNum.trim()) {
      ToastComponent("Error", "Please enter customer phone number.");
      return;
    }
    if (!phoneRegex.test(customerNum)) {
      ToastComponent("Error", "Please enter a valid 10-digit phone number.");
      return;
    }
    if (!selectedBrand) {
      ToastComponent("Error", "Please select a vehicle brand.");
      return;
    }
    if (!estimateAmount || isNaN(estimateAmount)) {
      ToastComponent("Error", "Please enter a valid estimate amount.");
      return;
    }
    if (!complaintType) {
      ToastComponent("Error", "Please select a complaint type.");
      return;
    }
    if (!works.trim()) {
      ToastComponent("Error", "Please describe the work to be done.");
      return;
    }
    if (selectedImages.length !== 2) {
      ToastComponent("Error", "Please upload exactly 2 before-work images.");
      return;
    }

    console.log("Creating booking with:", {
      vehicleName, vehicleNum, customerName, customerNum, selectedBrand, selectedEmployee, complaintType, works, estimateAmount, selectedImages
    });

    mutate({
      vehicleName,
      vehicleNum,
      customerName,
      customerNum,
      selectedBrand,
      selectedEmployee,
      complaintType,
      works,
      estimateAmount,
      selectedImages
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0220' }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0f0220', '#1a0533', '#0f0220']}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Decorative Orbs */}
      <View style={{ position: 'absolute', top: -50, left: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#8B5CF6', opacity: 0.1 }} />
      <View style={{ position: 'absolute', bottom: 100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#6D28D9', opacity: 0.1 }} />

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 }}>Bookings</Text>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>Manage workshop schedule</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setIsAddModalVisible(true);
          }}
          style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Feather name="plus" size={22} color="#c495ff" />
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={{ marginBottom: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
        >
          {statuses.map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setSelectedStatus(status)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: selectedStatus === status ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: selectedStatus === status ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{
                color: selectedStatus === status ? '#c495ff' : 'rgba(255,255,255,0.4)',
                fontSize: 13,
                fontWeight: selectedStatus === status ? '600' : '400'
              }}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.3)" />
          <TextInput
            style={{ flex: 1, marginLeft: 12, color: '#fff', fontSize: 14 }}
            placeholder="Search vehicle, customer or work…"
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Feather name="search" size={40} color="rgba(255,255,255,0.15)" />
            <Text style={{ color: 'rgba(255,255,255,0.35)', marginTop: 14, fontSize: 14 }}>No bookings match your search.</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => {
            const isOpen = openId === booking._id;
            const statusConfig = getStatusConfig(booking.status);
            return (
              <View
                key={booking._id}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: isOpen ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)',
                  marginBottom: 10,
                  overflow: 'hidden',
                }}
              >
                {/* Collapsed Header Row */}
                <TouchableOpacity
                  onPress={() => toggle(booking._id)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{booking.vehicleName}</Text>
                    <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{booking.customerName} · {new Date(booking.createdAt).toLocaleDateString()}</Text>
                  </View>

                  <View style={{ backgroundColor: statusConfig.bg, borderWidth: 1, borderColor: statusConfig.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: statusConfig.color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 }}>{booking.status}</Text>
                  </View>

                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isOpen ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color="rgba(255,255,255,0.5)" />
                  </View>
                </TouchableOpacity>

                {/* Expanded Body */}
                {isOpen && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="user" size={14} color="#c495ff" />
                        </View>
                        <View>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Assigned to</Text>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 1 }}>{booking.assignedTo?.name || 'Unassigned'}</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="dollar-sign" size={14} color="#c495ff" />
                        </View>
                        <View>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Estimate</Text>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 1 }}>₹{booking.estimateAmount}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 8 }}>Complaint Description</Text>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, marginBottom: 16 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 18 }}>{booking.description || 'No description provided'}</Text>
                    </View>

                    <ImageStrip
                      title="Before Work Images"
                      images={booking.beforeImages || []}
                      emptyText="No before-work images uploaded"
                      onPreview={(url, index) => setPreviewImage({ url, title: `Before work image ${index + 1}` })}
                    />

                    <ImageStrip
                      title="After Work Images"
                      images={booking.afterImages || []}
                      emptyText="No after-work images uploaded"
                      onPreview={(url, index) => setPreviewImage({ url, title: `After work image ${index + 1}` })}
                    />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add New Booking Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraScrollHeight={Platform.select({ ios: 20, android: 80 })}
          >
            <Pressable
              style={{ flexGrow: 1, justifyContent: 'flex-end' }}
              onPress={() => setIsAddModalVisible(false)}
            >
              <Pressable
                style={{
                  backgroundColor: '#1a0533',
                  borderTopLeftRadius: 32,
                  borderTopRightRadius: 32,
                  paddingBottom: insets.bottom + 24,
                  paddingHorizontal: 24,
                  width: '100%'
                }}
                onPress={(e) => e.stopPropagation()}
              >
                {/* Handle */}
                <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>New Booking</Text>
                  <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="x" size={20} color="rgba(255,255,255,0.5)" />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 16, paddingBottom: 20 }}>
                  {/* Customer Info Section */}
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 }}>Customer Information</Text>
                    <View style={{ gap: 12 }}>
                      <TextInput
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                        placeholder="Customer Name"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={customerName}
                        onChangeText={setCustomerName}
                      />
                      <TextInput
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                        placeholder="Customer Mobile Number"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        keyboardType="phone-pad"
                        value={customerNum}
                        onChangeText={(text) => setCustomerNum(text.replace(/[^0-9]/g, ''))}
                        maxLength={10}
                      />
                    </View>
                  </View>

                  {/* Vehicle Info Section */}
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 }}>Vehicle Details</Text>
                    <View style={{ gap: 12 }}>
                      <TextInput
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                        placeholder="Vehicle Name (e.g. Camry 2021)"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={vehicleName}
                        onChangeText={setVehicleName}
                      />
                      <TextInput
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                        placeholder="Vehicle Number (e.g. KA 01 AB 1234)"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={vehicleNum}
                        onChangeText={setVehicleNum}
                      />
                      <TextInput
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                        placeholder="Estimate Amount (₹)"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        keyboardType="numeric"
                        value={estimateAmount}
                        onChangeText={setEstimateAmount}
                      />

                      {/* Brand Dropdown replacement */}
                      <View>
                        <TouchableOpacity
                          onPress={() => setIsBrandModalOpen(true)}
                          style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <Text style={{ color: selectedBrand ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                            {brandsData?.find(b => b._id === selectedBrand)?.brandName || "Select Vehicle Brand"}
                          </Text>
                          <Feather name="chevron-down" size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Assignee & Complaint Section */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 }}>Employee</Text>
                      <TouchableOpacity
                        onPress={() => setIsEmployeeModalOpen(true)}
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <Text numberOfLines={1} style={{ color: selectedEmployee ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                          {selectedEmployee ? selectedEmployee.name : "Assign"}
                        </Text>
                        <Feather name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 }}>Complaint</Text>
                      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                        {['Low', 'Minor', 'Major'].map((type) => (
                          <TouchableOpacity
                            key={type}
                            onPress={() => setComplaintType(type)}
                            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: complaintType === type ? 'rgba(139,92,246,0.3)' : 'transparent' }}
                          >
                            <Text style={{ color: complaintType === type ? '#c495ff' : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700' }}>{type}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Work Description */}
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 }}>Works to be done</Text>
                    <TextInput
                      style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minHeight: 80 }}
                      placeholder="e.g. Oil Change, Brake Check..."
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      multiline
                      value={works}
                      onChangeText={setWorks}
                    />
                  </View>

                  {/* Image Upload Section */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 }}>Before Work Images ({selectedImages.length}/2)</Text>
                      {selectedEmployee && (
                        <Text style={{ color: '#c495ff', fontSize: 10, fontWeight: '600' }}>Exactly 2 required</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {selectedImages.map((image, index) => (
                        <View key={index} style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                          <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%' }} />
                          <TouchableOpacity
                            onPress={() => removeImage(index)}
                            style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Feather name="x" size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {selectedImages.length < 2 && (
                        <TouchableOpacity
                          onPress={pickImage}
                          style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Feather name="camera" size={24} color="#c495ff" />
                          <Text style={{ color: '#c495ff', fontSize: 10, marginTop: 4, fontWeight: '600' }}>Add Photo</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleCreateBooking}
                    style={{ marginTop: 8 }}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#6D28D9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 18, paddingVertical: 18, alignItems: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Create Booking</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      {/* Brand Selection Modal */}
      <Modal
        visible={isBrandModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsBrandModalOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          onPress={() => setIsBrandModalOpen(false)}
        >
          <View
            style={{
              backgroundColor: '#1a0533',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: insets.bottom + 24,
              maxHeight: '60%',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              borderBottomWidth: 0,
            }}
          >
            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Select Brand</Text>
              <TouchableOpacity onPress={() => setIsBrandModalOpen(false)}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12 }}>
                {brandsData?.map((brand) => {
                  const isSelected = selectedBrand === brand._id;
                  return (
                    <TouchableOpacity
                      key={brand._id}
                      onPress={() => {
                        setSelectedBrand(brand._id);
                        setIsBrandModalOpen(false);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                        padding: 16,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isSelected ? '#8B5CF6' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <LinearGradient
                        colors={isSelected ? ['#8B5CF6', '#6D28D9'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                        style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <Feather name="truck" size={16} color={isSelected ? '#fff' : '#c495ff'} />
                      </LinearGradient>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{brand.brandName}</Text>
                      </View>

                      {isSelected && (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="check" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Employee Selection Modal */}
      <Modal
        visible={isEmployeeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEmployeeModalOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          onPress={() => setIsEmployeeModalOpen(false)}
        >
          <View
            style={{
              backgroundColor: '#1a0533',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: insets.bottom + 24,
              maxHeight: '60%',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              borderBottomWidth: 0,
            }}
          >
            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Select Employee</Text>
              <TouchableOpacity onPress={() => setIsEmployeeModalOpen(false)}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12 }}>
                {/* Option for Unassigned */}
                <TouchableOpacity
                  onPress={() => {
                    setSelectedEmployee(null);
                    setIsEmployeeModalOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: !selectedEmployee ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                    padding: 16,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: !selectedEmployee ? '#8B5CF6' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <LinearGradient
                    colors={!selectedEmployee ? ['#8B5CF6', '#6D28D9'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                    style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Feather name="user-minus" size={16} color={!selectedEmployee ? '#fff' : '#c495ff'} />
                  </LinearGradient>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Unassigned</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>Leave unassigned</Text>
                  </View>

                  {!selectedEmployee && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="check" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>

                {employeesData?.map((emp) => {
                  const isSelected = selectedEmployee?._id === emp._id;
                  return (
                    <TouchableOpacity
                      key={emp._id}
                      onPress={() => {
                        setSelectedEmployee(emp);
                        setIsEmployeeModalOpen(false);
                        Alert.alert("Employee Selected", "You can now upload up to 3 images (max 2 from gallery recommended).");
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                        padding: 16,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isSelected ? '#8B5CF6' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <LinearGradient
                        colors={isSelected ? ['#8B5CF6', '#6D28D9'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                        style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <Text style={{ color: isSelected ? '#fff' : '#c495ff', fontSize: 16, fontWeight: '700' }}>
                          {emp.name?.charAt(0)?.toUpperCase()}
                        </Text>
                      </LinearGradient>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{emp.name}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{emp.role || 'employee'}</Text>
                      </View>

                      {isSelected && (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="check" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <ImagePreviewModal
        visible={!!previewImage}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)}
      />
    </View>
  );
}

function ImageStrip({ title, images, emptyText, onPreview }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      {images.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((imgUrl, index) => (
            <TouchableOpacity key={`${imgUrl}-${index}`} onPress={() => onPreview(imgUrl, index)} style={{ marginRight: 9 }}>
              <Image
                source={{ uri: imgUrl }}
                style={{ width: 78, height: 78, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={{ padding: 12, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
          <Text style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>{emptyText}</Text>
        </View>
      )}
    </View>
  );
}
