import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/api';
import apiRoutes from '../../src/apiRoutes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ToastComponent from '../../components/ToastComponent';

const { height } = Dimensions.get('window');

const createEmployeess = async({name, mobile}) => {
  try{
   const data = {
      name,
      phone:Number(mobile),
    };
 const res = await apiClient.post(apiRoutes.ADMIN.CREATE_EMPLOYEE, data)
 return res.data
  }catch(err){
   throw err
  }
}
const fetchEmployees = async() => {
  try{
 const res = await apiClient.get(apiRoutes.ADMIN.GET_EMPLOYEES)
 return res.data
  }catch(err){
   throw err
  }
}


export default function EmployeesScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userRole, setUserRole] = useState('admin');
  const insets = useSafeAreaInsets();
  
  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    const getRole = async () => {
      const role = await AsyncStorage.getItem('userRole');
      if (role) setUserRole(role);
    };
    getRole();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setMobile('');
    setModalVisible(true);
  };

  const openEditModal = (employee) => {
    setEditingId(employee._id);
    setName(employee.name);
    setMobile(employee.phone);
    setModalVisible(true);
  };
  const {data,isLoading}  = useQuery({
    queryKey:["employees"],
    queryFn:fetchEmployees,
  });

  const employeesList = data?.employees || [];

  const {mutate,isPending}= useMutation({
    mutationFn:createEmployeess,
    onSuccess:(data)=>{
      ToastComponent("Success",data.message)
      if (data?.temporaryPassword) {
        Alert.alert(
          "Temporary Password",
          `Share this one-time login password with the employee:\n\n${data.temporaryPassword}`
        );
      }
      setModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => {
        ToastComponent("Error",error?.message || "Something went wrong")
    } 
  });
  const saveEmployee = () => {
    const phoneRegex = /^[0-9]{10}$/;

    if (!name.trim()) {
      ToastComponent("Error", "Please enter full name.");
      return;
    }
    if (!mobile.trim()) {
      ToastComponent("Error", "Please enter mobile number.");
      return;
    }
    if (!phoneRegex.test(mobile)) {
      ToastComponent("Error", "Please enter a valid 10-digit mobile number.");
      return;
    }

    if (editingId) {
      ToastComponent("Info", "Editing is not implemented yet");
    } else {
      mutate({name, mobile});
    }
  };

  const deleteEmployee = (id) => {
    ToastComponent("Info", "Deleting is not implemented yet");
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0220' }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0f0220', '#1a0533', '#0f0220']}
        style={{ position: 'absolute', inset: 0 }}
      />
      
      {/* Decorative Orbs */}
      <View style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#8B5CF6', opacity: 0.15 }} />
      <View style={{ position: 'absolute', bottom: 100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#6D28D9', opacity: 0.1 }} />

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 }}>Team</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>Manage workshop employees</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }} 
        showsVerticalScrollIndicator={false}
      >
        {employeesList.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Feather name="users" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>No employees found.</Text>
          </View>
        ) : (
          employeesList.map((emp) => (
            <View 
              key={emp._id} 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)', 
                borderRadius: 28, 
                padding: 20, 
                borderWidth: 1, 
                borderColor: 'rgba(255,255,255,0.08)',
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <LinearGradient
                colors={['#8B5CF630', '#6D28D930']}
                style={{ width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' }}
              >
                <Text style={{ color: '#c495ff', fontSize: 20, fontWeight: '700' }}>{emp.name.charAt(0)}</Text>
              </LinearGradient>
              
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 2 }}>{emp.name}</Text>
                <Text style={{ color: '#c495ff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{emp.role || 'employee'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="phone" size={12} color="rgba(255,255,255,0.4)" style={{ marginRight: 6 }} />
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{emp.phone}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity 
                  onPress={() => openEditModal(emp)}
                  style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                >
                  <Feather name="edit-2" size={16} color="#c495ff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => deleteEmployee(emp._id)}
                  style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Feather name="trash-2" size={16} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB Add Button */}
      <TouchableOpacity 
        onPress={openAddModal}
        style={{
          position: 'absolute',
          bottom: 110,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#8B5CF6',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#8B5CF6',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={{ 
                width: '100%', 
                backgroundColor: '#1a0533', 
                borderTopLeftRadius: 36, 
                borderTopRightRadius: 36, 
                padding: 32, 
                paddingBottom: insets.bottom + 32,
                borderWidth: 1, 
                borderColor: 'rgba(255,255,255,0.1)',
                borderBottomWidth: 0,
              }}
            >
              <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, alignSelf: 'center', marginBottom: 32 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>
                  {editingId ? 'Edit Employee' : 'Add Employee'}
                </Text>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4, fontWeight: '700' }}>Full Name</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 20, height: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Feather name="user" size={20} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={{ flex: 1, marginLeft: 14, color: '#fff', fontSize: 16 }}
                    placeholder="e.g. John Doe"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 40 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4, fontWeight: '700' }}>Mobile Number</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 20, height: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Feather name="phone" size={20} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={{ flex: 1, marginLeft: 14, color: '#fff', fontSize: 16 }}
                    placeholder="e.g. +1 555-0198"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    keyboardType="phone-pad"
                    value={mobile}
                    onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))}
                    maxLength={10}
                  />
                </View>
              </View>

              <TouchableOpacity onPress={saveEmployee}>
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: '#8B5CF6', shadowOpacity: 0.3, shadowRadius: 15 }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginRight: 10 }}>
                    {editingId ? 'Save Changes' : 'Create Account'}
                  </Text>
                  <Feather name="check" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}
