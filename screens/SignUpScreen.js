import React, { useState, useRef, useEffect } from 'react' 
 import { 
   View, 
   Text, 
   TextInput, 
   TouchableOpacity, 
   StyleSheet, 
   Alert, 
   KeyboardAvoidingView, 
   Platform, 
   ScrollView, 
   Image,
   ActivityIndicator,
   Animated,
   Easing
 } from 'react-native' 
 import { AuthService } from '../lib/AuthService' 
 import { Ionicons } from '@expo/vector-icons'
 
 const SignUpScreen = ({ navigation }) => { 
   const [formData, setFormData] = useState({ 
     email: '', 
     password: '', 
     confirmPassword: '', 
     username: '', 
     fullName: '' 
     // Role will always be 'user' by default - no user input needed 
   }) 
   const [loading, setLoading] = useState(false) 
 
   const handleInputChange = (field, value) => { 
     setFormData(prev => ({ 
       ...prev, 
       [field]: value 
     })) 
   } 
 
   const validateForm = () => { 
     const { email, password, confirmPassword, username } = formData 
     
     if (!email || !password || !username) { 
       Alert.alert('Error', 'Please fill in all required fields') 
       return false 
     } 
 
     if (password !== confirmPassword) { 
       Alert.alert('Error', 'Passwords do not match') 
       return false 
     } 
 
     if (password.length < 6) { 
       Alert.alert('Error', 'Password must be at least 6 characters long') 
       return false 
     } 
 
     if (username.length < 3) { 
       Alert.alert('Error', 'Username must be at least 3 characters long') 
       return false 
     } 
 
     return true 
   } 
 
   const rotation = useRef(new Animated.Value(0)).current
   useEffect(() => {
     if (loading) {
       Animated.loop(
         Animated.timing(rotation, {
           toValue: 1,
           duration: 1200,
           easing: Easing.linear,
           useNativeDriver: true,
         })
       ).start()
     } else {
       rotation.stopAnimation()
       rotation.setValue(0)
     }
   }, [loading])

   const spin = rotation.interpolate({
     inputRange: [0, 1],
     outputRange: ['0deg', '360deg'],
   })
 
   const handleSignUp = async () => { 
     if (!validateForm()) return 
 
     setLoading(true) 
     try { 
       const { user, session } = await AuthService.signUp( 
         formData.email, 
         formData.password, 
         { 
           username: formData.username, 
           fullName: formData.fullName 
         } 
       ) 
 
       if (user) { 
         Alert.alert( 
           'Success!', 
           'Account created successfully. Please check your email to verify your account.', 
           [ 
             { 
               text: 'OK', 
               onPress: () => navigation.navigate('SignIn') 
             } 
           ] 
         ) 
       } 
     } catch (error) { 
       Alert.alert('Error', error.message) 
     } finally { 
       setLoading(false) 
     } 
   } 
 
   return ( 
     <KeyboardAvoidingView 
       style={styles.container} 
       behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
     > 
       <ScrollView contentContainerStyle={styles.scrollContainer}> 
         <View style={styles.formContainer}> 
           <Image 
             source={{ uri: 'https://ryuzzetivvijkiribkzt.supabase.co/storage/v1/object/public/SiteCaptureXLogo/SiteCaptureX%20logo%20cropped.png' }} 
             style={styles.logo} 
           /> 
           <Text style={styles.poweredBy}>Powered by Derheim Inc</Text>
           <Text style={styles.title}>Create Account</Text> 
           
           <TextInput 
             style={styles.input} 
             placeholder="Email *" 
             value={formData.email} 
             onChangeText={(value) => handleInputChange('email', value)} 
             keyboardType="email-address" 
             autoCapitalize="none" 
             autoCorrect={false} 
           /> 
 
           <TextInput 
             style={styles.input} 
             placeholder="Username *" 
             value={formData.username} 
             onChangeText={(value) => handleInputChange('username', value)} 
             autoCapitalize="none" 
             autoCorrect={false} 
           /> 
 
           <TextInput 
             style={styles.input} 
             placeholder="Full Name" 
             value={formData.fullName} 
             onChangeText={(value) => handleInputChange('fullName', value)} 
             autoCapitalize="words" 
           /> 
 
           <TextInput 
             style={styles.input} 
             placeholder="Password *" 
             value={formData.password} 
             onChangeText={(value) => handleInputChange('password', value)} 
             secureTextEntry 
           /> 
 
           <TextInput 
             style={styles.input} 
             placeholder="Confirm Password *" 
             value={formData.confirmPassword} 
             onChangeText={(value) => handleInputChange('confirmPassword', value)} 
             secureTextEntry 
           /> 
 
           <TouchableOpacity 
             style={[styles.button, loading && styles.buttonDisabled]} 
             onPress={handleSignUp} 
             disabled={loading} 
           > 
             <Text style={styles.buttonText}> 
               {loading ? 'Creating Account...' : 'Sign Up'} 
             </Text> 
           </TouchableOpacity> 
 
           <TouchableOpacity 
             style={styles.linkButton} 
             onPress={() => navigation.navigate('SignIn')} 
           > 
             <Text style={styles.linkText}> 
               Already have an account? Sign In 
             </Text> 
           </TouchableOpacity> 
         </View> 
       </ScrollView> 

       {loading && (
         <View style={styles.loaderOverlay}>
           <Animated.View style={{ transform: [{ rotate: spin }], marginBottom: 12 }}>
             <Ionicons name="construct-outline" size={64} color="#F59E0B" />
           </Animated.View>
           <Text style={styles.loaderText}>Creating your account...</Text>
           <ActivityIndicator size="large" color="#007AFF" />
         </View>
       )}
     </KeyboardAvoidingView> 
   ) 
 } 
 
 const styles = StyleSheet.create({ 
   container: { 
     flex: 1, 
     backgroundColor: '#f5f5f5', 
   }, 
   scrollContainer: { 
     flexGrow: 1, 
     justifyContent: 'center', 
     padding: 20, 
   }, 
   formContainer: { 
     backgroundColor: 'white', 
     padding: 20, 
     borderRadius: 10, 
     shadowColor: '#000', 
     shadowOffset: { 
       width: 0, 
       height: 2, 
     }, 
     shadowOpacity: 0.1, 
     shadowRadius: 3.84, 
     elevation: 5, 
   }, 
   title: { 
     fontSize: 28, 
     fontWeight: 'bold', 
     textAlign: 'center', 
     marginBottom: 30, 
     color: '#333', 
   }, 
   input: { 
     borderWidth: 1, 
     borderColor: '#ddd', 
     padding: 15, 
     borderRadius: 8, 
     marginBottom: 15, 
     fontSize: 16, 
     backgroundColor: '#f9f9f9', 
   }, 
   button: { 
     backgroundColor: '#007AFF', 
     padding: 15, 
     borderRadius: 8, 
     marginTop: 10, 
   }, 
   buttonDisabled: { 
     backgroundColor: '#ccc', 
   }, 
   buttonText: { 
     color: 'white', 
     textAlign: 'center', 
     fontSize: 16, 
     fontWeight: 'bold', 
   }, 
   linkButton: { 
     marginTop: 20, 
   }, 
   linkText: { 
     color: '#007AFF', 
     textAlign: 'center', 
     fontSize: 16, 
   }, 
   logo: { 
     width: 320, 
     height: 320, 
     resizeMode: 'contain', 
     alignSelf: 'center', 
     marginBottom: 8, 
   }, 
   poweredBy: {
     textAlign: 'center',
     color: '#888',
     fontSize: 12,
     marginBottom: 12,
   },
   loaderOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0,0,0,0.35)',
     justifyContent: 'center',
     alignItems: 'center',
     padding: 24,
   },
   loaderText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: '600',
     marginBottom: 8,
   },
 }) 
 
 export default SignUpScreen