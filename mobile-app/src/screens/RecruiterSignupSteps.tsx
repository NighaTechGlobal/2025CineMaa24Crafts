import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import PremiumModal from '../components/PremiumModal';
import HeaderBar from '../components/HeaderBar';
import ImageUploader from '../components/ImageUploader';
import { colors, spacing, fontSize, borderRadius } from '../styles/tokens';
import { signup, sessionLogin } from '../services/api';
import { storeSessionId } from '../services/authStorage';
import { storeToken, storeUser } from '../services/authStorage';
import { useDialog } from '../hooks/useDialog';

interface RecruiterSignupStepsProps {
    navigation: any;
    route?: {
        params?: {
            phone?: string;
            otp?: string;
        };
    };
}

// Department options for recruiters
const DEPARTMENT_OPTIONS = [
    'Acting', 'Direction', 'Cinematography', 'Editing', 'Sound',
    'Art Dept', 'Makeup', 'Costume', 'VFX', 'Production', 'Others',
    'Recruiting / HR / Production House'
];

// State options
const STATE_OPTIONS = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

// Gender options
const GENDER_OPTIONS = [
    'Male', 'Female', 'Non-binary', 'Prefer not to say'
];

const RecruiterSignupSteps: React.FC<RecruiterSignupStepsProps> = ({ navigation, route }) => {
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const getHeaderTitle = () => (currentStep === 1 ? 'Basic Profile' : currentStep === 2 ? 'Social & Links' : 'Verification');
    const [submitting, setSubmitting] = useState(false);
    const { showDialog, hideDialog, DialogPortal } = useDialog();
    
    // Get phone and OTP from route params
    const phone = route?.params?.phone || '';
    const otp = route?.params?.otp || '';

    // Form state
    const [formData, setFormData] = useState({
        // Step 1 - Basic personal + company
        firstName: '',
        email: '',
        phone: '',
        alternativePhone: '',
        maaAssociativeNumber: '',
        gender: '',
        department: '',
        companyName: '',
        companyPhone: '',
        companyEmail: '',
        state: '',
        city: '',
        profilePhoto: null as any,
        companyLogo: null as any,

        // Step 2 - Social & links (same as artist)
        website: '',
        facebook: '',
        twitter: '',
        instagram: '',
        youtube: '',
        customLinks: [''],

        // Step 3 - Aadhar (optional)
        aadharNumber: '',
    });

    const handleFormComplete = async () => {
        // Validate required fields
        if (!formData.firstName || !formData.email || !formData.gender || 
            !formData.department || !formData.companyName || !formData.state || !formData.city) {
            showDialog({
                title: 'Validation Error',
                message: 'Please fill all required fields.',
                type: 'warning',
                primaryLabel: 'OK',
                onPrimaryPress: hideDialog,
            });
            return;
        }

        if (!formData.profilePhoto) {
            showDialog({
                title: 'Validation Error',
                message: 'Please upload your profile photo.',
                type: 'warning',
                primaryLabel: 'OK',
                onPrimaryPress: hideDialog,
            });
            return;
        }

        if (!phone || !otp) {
            showDialog({
                title: 'Missing Details',
                message: 'Phone and OTP are required. Please go back and login again.',
                type: 'warning',
                primaryLabel: 'OK',
                onPrimaryPress: hideDialog,
            });
            return;
        }

        if (!formData.aadharNumber || !/^\d{16}$/.test(formData.aadharNumber)) {
            showDialog({
                title: 'Invalid Aadhar',
                message: 'Aadhar number must be exactly 16 digits.',
                type: 'warning',
                primaryLabel: 'OK',
                onPrimaryPress: hideDialog,
            });
            return;
        }

        setSubmitting(true);
        try {
            // Images: ImageUploader already returns base64 strings
            const profilePhotoBase64 = formData.profilePhoto;
            const companyLogoBase64 = formData.companyLogo || undefined;
            const aadharNumber = formData.aadharNumber || undefined;

            // Prepare signup data
            const signupData = {
                phone,
                otp,
                firstName: formData.firstName,
                email: formData.email,
                alternativePhone: formData.alternativePhone || undefined,
                maaAssociativeNumber: formData.maaAssociativeNumber || undefined,
                gender: formData.gender,
                department: formData.department,
                state: formData.state,
                city: formData.city,
                profilePhoto: profilePhotoBase64 || undefined,
                role: 'recruiter' as const,
                companyName: formData.companyName,
                companyPhone: formData.companyPhone || undefined,
                companyEmail: formData.companyEmail || undefined,
                companyLogo: companyLogoBase64 || undefined,
                website: formData.website || undefined,
                facebook: formData.facebook || undefined,
                twitter: formData.twitter || undefined,
                instagram: formData.instagram || undefined,
                youtube: formData.youtube || undefined,
                customLinks: formData.customLinks.filter(link => link.trim() !== '') || undefined,
                aadharNumber,
            };

            // Call signup API
            const response = await signup(signupData);
            
            // Store auth token and user data
            if (response.token) {
              await storeToken(response.token);
            }
            await storeUser({
                id: response.user.id,
                phone: response.user.phone,
                email: response.user.email,
                role: response.user.role,
                firstName: response.user.firstName,
            });

            // Create session for SessionGuard endpoints
            const loginRes = await sessionLogin(phone, otp, Platform.OS);
            if (loginRes.session_id) {
              await storeSessionId(loginRes.session_id);
            }

            // Show premium modal after successful signup
            setShowPremiumModal(true);
        } catch (error: any) {
            console.error('Signup error:', error);
            showDialog({
                title: 'Signup Failed',
                message: error.response?.data?.message || 'Failed to create account. Please try again.',
                type: 'error',
                primaryLabel: 'OK',
                onPrimaryPress: hideDialog,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpgrade = () => {
        // Handle premium upgrade
        setShowPremiumModal(false);
        navigation.replace('Main');
    };

    const handleSkip = () => {
        // Handle skip premium
        setShowPremiumModal(false);
        navigation.replace('Main');
    };

    // Handle input changes
    const handleInputChange = (field: string, value: string) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    // Handle custom link changes
    const handleCustomLinkChange = (index: number, value: string) => {
        const newLinks = [...formData.customLinks];
        newLinks[index] = value;
        setFormData({
            ...formData,
            customLinks: newLinks
        });
    };

    // Add new custom link
    const addCustomLink = () => {
        setFormData({
            ...formData,
            customLinks: [...formData.customLinks, '']
        });
    };

    // Remove custom link
    const removeCustomLink = (index: number) => {
        const newLinks = [...formData.customLinks];
        newLinks.splice(index, 1);
        setFormData({
            ...formData,
            customLinks: newLinks
        });
    };

    // Render Step 1 - Basic Personal + Company
    const renderStep1 = () => (
        <ScrollView style={styles.stepContainer}>
            {/* <Text style={styles.stepTitle}>Basic Profile</Text> */}

            {/* Personal Information */}
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    placeholder="Enter your first name"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Id *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone number *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Alternative number</Text>
                <TextInput
                    style={styles.input}
                    value={formData.alternativePhone}
                    onChangeText={(value) => handleInputChange('alternativePhone', value)}
                    placeholder="Enter alternative number"
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Maa Associative number</Text>
                <TextInput
                    style={styles.input}
                    value={formData.maaAssociativeNumber}
                    onChangeText={(value) => handleInputChange('maaAssociativeNumber', value)}
                    placeholder="Enter Maa Associative number"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.gender}
                        onValueChange={(value: string) => handleInputChange('gender', value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select Gender" value="" />
                        {GENDER_OPTIONS.map((option) => (
                            <Picker.Item key={option} label={option} value={option} />
                        ))}
                    </Picker>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Department *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.department}
                        onValueChange={(value: string) => handleInputChange('department', value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select Department" value="" />
                        {DEPARTMENT_OPTIONS.map((option) => (
                            <Picker.Item key={option} label={option} value={option} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Company Information */}
            <Text style={styles.sectionTitle}>Company Information</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Company name *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.companyName}
                    onChangeText={(value) => handleInputChange('companyName', value)}
                    placeholder="Enter company name"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Company phone</Text>
                <TextInput
                    style={styles.input}
                    value={formData.companyPhone}
                    onChangeText={(value) => handleInputChange('companyPhone', value)}
                    placeholder="Enter company phone"
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Company email</Text>
                <TextInput
                    style={styles.input}
                    value={formData.companyEmail}
                    onChangeText={(value) => handleInputChange('companyEmail', value)}
                    placeholder="Enter company email"
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Company logo</Text>
                <ImageUploader
                    value={formData.companyLogo || undefined}
                    onChange={(image) => handleInputChange('companyLogo', image)}
                    shape="rectangle"
                    aspectRatio={[4, 3]}
                    preferBase64
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>State *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.state}
                        onValueChange={(value: string) => handleInputChange('state', value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select State" value="" />
                        {STATE_OPTIONS.map((option) => (
                            <Picker.Item key={option} label={option} value={option} />
                        ))}
                    </Picker>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.city}
                    onChangeText={(value) => handleInputChange('city', value)}
                    placeholder="Enter your city"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Photo Upload *</Text>
                <ImageUploader
                    value={formData.profilePhoto || undefined}
                    onChange={(image) => handleInputChange('profilePhoto', image)}
                    shape="circle"
                    aspectRatio={[1, 1]}
                    preferBase64
                />
            </View>

            {/* Aadhar moved to Step 3 */}
        </ScrollView>
    );

    // Render Step 2 - Social & Links (same as artist)
    const renderStep2 = () => (
        <ScrollView style={styles.stepContainer}>
            {/* <Text style={styles.stepTitle}>Social & Links</Text> */}

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                    style={styles.input}
                    value={formData.website}
                    onChangeText={(value) => handleInputChange('website', value)}
                    placeholder="https://yourwebsite.com"
                    keyboardType="url"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Facebook</Text>
                <TextInput
                    style={styles.input}
                    value={formData.facebook}
                    onChangeText={(value) => handleInputChange('facebook', value)}
                    placeholder="https://facebook.com/yourprofile"
                    keyboardType="url"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Twitter</Text>
                <TextInput
                    style={styles.input}
                    value={formData.twitter}
                    onChangeText={(value) => handleInputChange('twitter', value)}
                    placeholder="https://twitter.com/yourprofile"
                    keyboardType="url"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Instagram</Text>
                <TextInput
                    style={styles.input}
                    value={formData.instagram}
                    onChangeText={(value) => handleInputChange('instagram', value)}
                    placeholder="https://instagram.com/yourprofile"
                    keyboardType="url"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>YouTube</Text>
                <TextInput
                    style={styles.input}
                    value={formData.youtube}
                    onChangeText={(value) => handleInputChange('youtube', value)}
                    placeholder="https://youtube.com/yourchannel"
                    keyboardType="url"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Add your own link</Text>
                {formData.customLinks.map((link, index) => (
                    <View key={index} style={styles.customLinkContainer}>
                        <TextInput
                            style={[styles.input, styles.customLinkInput]}
                            value={link}
                            onChangeText={(value) => handleCustomLinkChange(index, value)}
                            placeholder="https://example.com"
                            keyboardType="url"
                        />
                        {formData.customLinks.length > 1 && (
                            <TouchableOpacity
                                style={styles.removeLinkButton}
                                onPress={() => removeCustomLink(index)}
                            >
                                <Text style={styles.removeLinkText}>×</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                <TouchableOpacity
                    style={styles.addLinkButton}
                    onPress={addCustomLink}
                >
                    <Text style={styles.addLinkText}>+ Add another link</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    // Render Step 3 - Aadhar Verification (same as artist)
    const renderStep3 = () => (
        <ScrollView style={styles.stepContainer}>
            <Text style={styles.stepSubtitle}>Provide your Aadhar number for verification</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Aadhar Number *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.aadharNumber}
                    onChangeText={(value) => handleInputChange('aadharNumber', value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter your Aadhar number"
                    keyboardType="number-pad"
                    maxLength={16}
                />
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleFormComplete}
                >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    // Render current step
    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            default:
                return renderStep1();
        }
    };

    // Handle next step
    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            handleFormComplete();
        }
    };

    // Check if continue button should be disabled
    const isContinueDisabled = () => {
        if (currentStep === 3) return submitting;
        return false;
    };

    // Handle previous step
    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <View style={styles.container}>
            <HeaderBar title={getHeaderTitle()} leftIconName="arrow-back" onLeftPress={() => navigation.goBack()} />
            {/* Step Indicator removed for cleaner UI */}

            {/* Step Content */}
            {renderCurrentStep()}

            {/* Navigation Buttons */}
            <View style={styles.navigation}>
                {currentStep > 1 && (
                    <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                        <Text style={styles.navButtonText}>Back</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.navButton, styles.nextButton]}
                    onPress={handleNext}
                    disabled={isContinueDisabled()}
                >
                    {submitting && currentStep === 3 ? (
                        <ActivityIndicator color={colors.primaryText} />
                    ) : (
                        <Text style={styles.nextButtonText}>
                            {currentStep === 3 ? 'Finish' : 'Next'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Premium Modal */}
            <PremiumModal
                visible={showPremiumModal}
                userType="recruiter"
                onClose={() => setShowPremiumModal(false)}
                onUpgrade={handleUpgrade}
                onSkip={handleSkip}
            />
            {/* Modern dialog overlay */}
            <DialogPortal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    stepIndicator: { display: 'none' },
    stepDot: { display: 'none' },
    activeStepDot: { display: 'none' },
    stepContainer: {
        flex: 1,
        padding: spacing.lg,
    },
    stepTitle: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.accentInactive,
    },
    stepSubtitle: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        marginBottom: spacing.sm,
        },
    input: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        borderWidth: 1,
        borderColor: colors.accentInactive,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        backgroundColor: colors.white,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: colors.accentInactive,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.white,
        ...Platform.select({
            android: {
                elevation: 1,
            },
            ios: {
                shadowColor: colors.primaryText,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
        }),
    },
    picker: {
        height: 50,
        width: '100%',
    },
    customLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    customLinkInput: {
        flex: 1,
        marginRight: spacing.sm,
    },
    removeLinkButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.accentInactive,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeLinkText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    addLinkButton: {
        padding: spacing.sm,
        alignItems: 'flex-start',
    },
    addLinkText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
        textDecorationLine: 'underline',
    },
    aadharContainer: {
        marginBottom: spacing.xl,
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    primaryButton: {
        backgroundColor: colors.primaryText,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 300,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: fontSize.body,
        color: colors.white,
        },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.lg,
        backgroundColor: colors.cardBackground,
    },
    navButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    navButtonText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    nextButton: {
        backgroundColor: colors.gradStart,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.xl,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    nextButtonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        },
});

export default RecruiterSignupSteps;
