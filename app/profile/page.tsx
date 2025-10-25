"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth-context';
import AuthService from '@/lib/auth';
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiUsers,
  FiSettings,
  FiShield,
  FiBook,
  FiHeart,
  FiStar,
  FiEdit,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiEye,
  FiLock,
  FiRefreshCw,
  FiSearch,
  FiUserPlus,
  FiLink
} from 'react-icons/fi';
import type { Profile, Child, EditableProfile, UserSearchResult, AuthState, AssignmentRole } from '@/types/profile';

// Role assignment configuration
const ROLE_ASSIGNMENT_CONFIG = {
  parent: ['kid', 'healthcare_provider', 'principal', 'caregiver', 'external_educator'] as AssignmentRole[],
  guardian: ['kid', 'healthcare_provider', 'principal', 'caregiver', 'external_educator'] as AssignmentRole[],
  principal: ['class_teacher', 'teacher', 'healthcare_provider', 'caregiver'] as AssignmentRole[],
  admin: ['kid', 'parent', 'guardian', 'teacher', 'caregiver', 'healthcare_provider', 'admin', 'principal', 'external_educator', 'class_teacher'] as AssignmentRole[],
};

const ROLE_DESCRIPTIONS = {
  kid: 'Student managing their own learning journey',
  parent: 'Parent managing children\'s education and progress',
  guardian: 'Legal guardian overseeing child development',
  teacher: 'Educator tracking student progress and milestones',
  class_teacher: 'Primary classroom teacher with additional responsibilities',
  caregiver: 'Care provider monitoring child development',
  healthcare_provider: 'Medical professional reviewing growth metrics',
  admin: 'Administrator with full system access',
  principal: 'School principal overseeing all students and staff',
  external_educator: 'Specialized educator or tutor'
};

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editableProfile, setEditableProfile] = useState<EditableProfile | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAssignUser, setShowAssignUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    dob: '',
    gender: '',
    createUserAccount: true,
    email: '',
    password: ''
  });
  const [assignmentRole, setAssignmentRole] = useState<AssignmentRole>('kid');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, [user, authLoading]);

  const checkAuthAndLoadProfile = async () => {
    try {
      console.log('🔐 Checking authentication state...');
      
      if (authLoading) {
        setAuthState('checking');
        return;
      }

      if (!user) {
        console.log('❌ No user found, redirecting to auth');
        setAuthState('unauthenticated');
        
        const currentPath = window.location.pathname;
        const authUrl = `/auth?redirect=${encodeURIComponent(currentPath)}`;
        router.push(authUrl);
        return;
      }

      console.log('✅ User found:', user.email);
      setAuthState('authenticated');
      
      await loadProfileAndChildren(user.id);
      
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState('unauthenticated');
      router.push('/auth');
    }
  };

  const loadProfileAndChildren = async (userId: string) => {
    try {
      console.log('📥 Loading profile for user:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile load error:', profileError);
        
        if (profileError.code === 'PGRST116') {
          console.log('🆕 Profile not found, creating new profile...');
          await createUserProfile(userId);
          return;
        }
        throw profileError;
      }

      if (!profileData) {
        setAuthState('no_profile');
        return;
      }

      console.log('✅ Profile loaded:', profileData);
      setProfile(profileData);
      setEditableProfile({
        full_name: profileData.full_name,
        email: profileData.email,
        metadata: profileData.metadata || {}
      });

      await loadChildren(profileData);

    } catch (error) {
      console.error('Error loading profile:', error);
      setAuthState('no_profile');
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      if (!user) throw new Error('No user found');

      const { data: profileData, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: user.user_metadata?.full_name || 'User',
          email: user.email,
          role: user.user_metadata?.role || 'parent',
          metadata: {
            created_via: 'auto_create',
            created_at: new Date().toISOString()
          },
          children_ids: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;
      
      console.log('✅ New profile created:', profileData);
      setProfile(profileData);
      setEditableProfile({
        full_name: profileData.full_name,
        email: profileData.email,
        metadata: profileData.metadata || {}
      });
      setAuthState('authenticated');

    } catch (error) {
      console.error('Error creating profile:', error);
      setAuthState('no_profile');
    }
  };

  const loadChildren = async (profileData: Profile) => {
    try {
      let childData = [];

      if (profileData.role === 'kid') {
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('created_by', profileData.id)
          .eq('metadata->>is_self', 'true');

        if (error) throw error;
        childData = data || [];
      } else if (['parent', 'guardian', 'teacher', 'caregiver'].includes(profileData.role)) {
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .in('id', profileData.children_ids || []);

        if (error) throw error;
        childData = data || [];
      } else if (['admin', 'principal'].includes(profileData.role)) {
        const { data, error } = await supabase
          .from('children')
          .select('*');

        if (error) throw error;
        childData = data || [];
      }

      console.log(`✅ Loaded ${childData.length} children`);
      setChildren(childData);

    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editableProfile || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editableProfile.full_name,
          metadata: editableProfile.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...editableProfile } : null);
      setEditing(false);
      
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddChild = async () => {
    if (!profile || !newChild.name || !newChild.dob) return;

    try {
      // If creating user account, use AuthService
      if (newChild.createUserAccount && newChild.email && newChild.password) {
        await AuthService.signUp(
          newChild.email,
          newChild.password,
          newChild.name,
          newChild.dob,
          'kid'
        );
        
        // The user creation will trigger profile creation via database triggers
        // We'll search for the user and link them
        setTimeout(async () => {
          await linkExistingUserAsChild(newChild.email);
        }, 2000);
        
      } else {
        // Create child record only (without user account)
        const { data: childData, error } = await supabase
          .from('children')
          .insert([{
            name: newChild.name,
            dob: newChild.dob,
            gender: newChild.gender,
            created_by: profile.id,
            metadata: {
              created_by_role: profile.role,
              created_via: 'profile_page',
              added_at: new Date().toISOString(),
              has_user_account: false
            }
          }])
          .select()
          .single();

        if (error) throw error;

        await updateProfileChildrenIds(childData.id);
        setChildren(prev => [...prev, childData]);
      }

      setNewChild({ name: '', dob: '', gender: '', createUserAccount: true, email: '', password: '' });
      setShowAddChild(false);
      
      console.log('✅ Child added successfully');
    } catch (error) {
      console.error('Error adding child:', error);
      alert('Failed to add child. Please try again.');
    }
  };

  const linkExistingUserAsChild = async (email: string) => {
    try {
      // Search for the user's profile
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (error) throw error;

      // Create child record linked to the user
      const { data: childData, error: childError } = await supabase
        .from('children')
        .insert([{
          name: newChild.name,
          dob: newChild.dob,
          gender: newChild.gender,
          created_by: profile!.id,
          metadata: {
            created_by_role: profile!.role,
            created_via: 'profile_page_with_user',
            added_at: new Date().toISOString(),
            has_user_account: true,
            linked_user_id: userProfile.id
          }
        }])
        .select()
        .single();

      if (childError) throw childError;

      await updateProfileChildrenIds(childData.id);
      setChildren(prev => [...prev, childData]);

    } catch (error) {
      console.error('Error linking user as child:', error);
      throw error;
    }
  };

  const handleAssignUser = async () => {
    if (!profile || !selectedUser || !assignmentRole) return;

    setAssigning(true);
    try {
      // Update the user's role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: assignmentRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // If assigning as kid, also create a child record
      if (assignmentRole === 'kid') {
        const { data: childData, error: childError } = await supabase
          .from('children')
          .insert([{
            name: selectedUser.full_name,
            dob: new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0], // Default 10 years ago
            gender: 'prefer_not_to_say',
            created_by: profile.id,
            metadata: {
              created_by_role: profile.role,
              created_via: 'role_assignment',
              added_at: new Date().toISOString(),
              has_user_account: true,
              linked_user_id: selectedUser.id,
              assigned_role: assignmentRole
            }
          }])
          .select()
          .single();

        if (childError) throw childError;
        await updateProfileChildrenIds(childData.id);
        setChildren(prev => [...prev, childData]);
      }

      // Reset form
      setSelectedUser(null);
      setUserSearchQuery('');
      setSearchResults([]);
      setShowAssignUser(false);
      
      alert(`✅ Successfully assigned ${selectedUser.full_name} as ${assignmentRole}`);
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Failed to assign user. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const updateProfileChildrenIds = async (childId: string) => {
    if (!profile) return;

    const updatedChildrenIds = [...(profile.children_ids || []), childId];
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ children_ids: updatedChildrenIds })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    setProfile(prev => prev ? { ...prev, children_ids: updatedChildrenIds } : null);
  };

  const handleDeleteChild = async (childId: string) => {
    if (!profile) return;

    if (!confirm('Are you sure you want to remove this child?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

      if (error) throw error;

      const updatedChildrenIds = profile.children_ids?.filter(id => id !== childId) || [];
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ children_ids: updatedChildrenIds })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setChildren(prev => prev.filter(child => child.id !== childId));
      setProfile(prev => prev ? { ...prev, children_ids: updatedChildrenIds } : null);
      
      console.log('✅ Child removed successfully');
    } catch (error) {
      console.error('Error deleting child:', error);
      alert('Failed to remove child. Please try again.');
    }
  };

  const handleRetry = () => {
    setAuthState('checking');
    checkAuthAndLoadProfile();
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'kid': return <FiUsers className="w-5 h-5" />;
      case 'parent': return <FiHeart className="w-5 h-5" />;
      case 'guardian': return <FiShield className="w-5 h-5" />;
      case 'teacher': return <FiBook className="w-5 h-5" />;
      case 'class_teacher': return <FiBook className="w-5 h-5" />;
      case 'caregiver': return <FiHeart className="w-5 h-5" />;
      case 'healthcare_provider': return <FiStar className="w-5 h-5" />;
      case 'admin': return <FiSettings className="w-5 h-5" />;
      case 'principal': return <FiUser className="w-5 h-5" />;
      case 'external_educator': return <FiBook className="w-5 h-5" />;
      default: return <FiUser className="w-5 h-5" />;
    }
  };

  const getRoleDescription = (role: string) => {
    return ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS] || 'User';
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getAssignableRoles = () => {
    if (!profile) return [];
    return ROLE_ASSIGNMENT_CONFIG[profile.role as keyof typeof ROLE_ASSIGNMENT_CONFIG] || [];
  };

  // Loading State
  if (authState === 'checking' || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated State
  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="card-elevated p-8 max-w-md text-center animate-scale-in">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access your profile.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="btn btn-ghost"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile Not Found State
  if (authState === 'no_profile' || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="card-elevated p-8 max-w-md text-center animate-scale-in">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUser className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn't find your profile information.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={handleSignOut}
              className="btn btn-ghost"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Profile Content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your personal information and connected children
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="btn btn-ghost btn-sm flex items-center gap-2"
              title="Refresh profile data"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white">
                    {getRoleIcon(profile.role)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {profile.full_name}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="badge badge-primary">
                        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getRoleDescription(profile.role)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="btn btn-ghost btn-sm flex items-center space-x-2"
                >
                  {editing ? <FiX className="w-4 h-4" /> : <FiEdit className="w-4 h-4" />}
                  <span>{editing ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              {/* Editable Profile Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editableProfile?.full_name || ''}
                        onChange={(e) => setEditableProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                        className="input w-full"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{profile.full_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white flex items-center">
                      <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                      {profile.email}
                    </p>
                  </div>
                </div>

                {/* Additional Metadata Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={editableProfile?.metadata?.phone || ''}
                        onChange={(e) => setEditableProfile(prev => prev ? {
                          ...prev,
                          metadata: { ...prev.metadata, phone: e.target.value }
                        } : null)}
                        className="input w-full"
                        placeholder="+1 (555) 123-4567"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">
                        {profile.metadata?.phone || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Emergency Contact
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editableProfile?.metadata?.emergency_contact || ''}
                        onChange={(e) => setEditableProfile(prev => prev ? {
                          ...prev,
                          metadata: { ...prev.metadata, emergency_contact: e.target.value }
                        } : null)}
                        className="input w-full"
                        placeholder="Emergency contact details"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">
                        {profile.metadata?.emergency_contact || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setEditing(false)}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <FiSave className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Children & User Management Section */}
            {!['kid'].includes(profile.role) && (
              <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Managed Children & Users
                  </h3>
                  <div className="flex gap-2">
                    {getAssignableRoles().length > 0 && (
                      <button
                        onClick={() => setShowAssignUser(true)}
                        className="btn btn-secondary btn-sm flex items-center space-x-2"
                      >
                        <FiLink className="w-4 h-4" />
                        <span>Assign User</span>
                      </button>
                    )}
                    {['parent', 'guardian', 'teacher', 'caregiver', 'admin', 'principal'].includes(profile.role) && (
                      <button
                        onClick={() => setShowAddChild(true)}
                        className="btn btn-primary btn-sm flex items-center space-x-2"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Add Child</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Assign User Form */}
                {showAssignUser && (
                  <div className="card p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Assign User Role</h4>
                    
                    {/* Role Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assign Role
                      </label>
                      <select
                        value={assignmentRole}
                        onChange={(e) => setAssignmentRole(e.target.value as AssignmentRole)}
                        className="input w-full"
                      >
                        <option value="">Select Role</option>
                        {getAssignableRoles().map(role => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {ROLE_DESCRIPTIONS[assignmentRole]}
                      </p>
                    </div>

                    {/* User Search */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Search User
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={userSearchQuery}
                          onChange={(e) => {
                            setUserSearchQuery(e.target.value);
                            searchUsers(e.target.value);
                          }}
                          className="input w-full pr-10"
                        />
                        <FiSearch className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                      </div>
                      
                      {/* Search Results */}
                      {searching && (
                        <div className="text-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                      )}
                      
                      {searchResults.length > 0 && (
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                          {searchResults.map(user => (
                            <div
                              key={user.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedUser?.id === user.id 
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                              onClick={() => setSelectedUser(user)}
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email} • {user.role}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        onClick={() => {
                          setShowAssignUser(false);
                          setSelectedUser(null);
                          setUserSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAssignUser}
                        disabled={!selectedUser || !assignmentRole || assigning}
                        className="btn btn-primary btn-sm"
                      >
                        {assigning ? 'Assigning...' : 'Assign Role'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Add Child Form */}
                {showAddChild && (
                  <div className="card p-4 mb-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Add New Child</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Child's Name"
                        value={newChild.name}
                        onChange={(e) => setNewChild(prev => ({ ...prev, name: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="date"
                        value={newChild.dob}
                        onChange={(e) => setNewChild(prev => ({ ...prev, dob: e.target.value }))}
                        className="input"
                        max={new Date().toISOString().split('T')[0]}
                      />
                      <select
                        value={newChild.gender}
                        onChange={(e) => setNewChild(prev => ({ ...prev, gender: e.target.value }))}
                        className="input"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    {/* User Account Creation Toggle */}
                    <div className="mb-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newChild.createUserAccount}
                          onChange={(e) => setNewChild(prev => ({ ...prev, createUserAccount: e.target.checked }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Create user account for this child
                        </span>
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Child will be able to log in and access their learning materials
                      </p>
                    </div>

                    {/* User Account Fields */}
                    {newChild.createUserAccount && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="email"
                          placeholder="Email address for login"
                          value={newChild.email}
                          onChange={(e) => setNewChild(prev => ({ ...prev, email: e.target.value }))}
                          className="input"
                        />
                        <input
                          type="password"
                          placeholder="Temporary password"
                          value={newChild.password}
                          onChange={(e) => setNewChild(prev => ({ ...prev, password: e.target.value }))}
                          className="input"
                        />
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        onClick={() => {
                          setShowAddChild(false);
                          setNewChild({ name: '', dob: '', gender: '', createUserAccount: true, email: '', password: '' });
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddChild}
                        disabled={!newChild.name || !newChild.dob || (newChild.createUserAccount && (!newChild.email || !newChild.password))}
                        className="btn btn-primary btn-sm"
                      >
                        Add Child
                      </button>
                    </div>
                  </div>
                )}

                {/* Children List */}
                <div className="space-y-4">
                  {children.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FiUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No children found. {['parent', 'guardian'].includes(profile.role) && 'Add a child to get started.'}</p>
                    </div>
                  ) : (
                    children.map((child, index) => (
                      <div
                        key={child.id}
                        className="card p-4 animate-fade-in"
                        style={{ animationDelay: `${300 + index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white">
                              <FiUser className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {child.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Age: {calculateAge(child.dob)} • {child.gender || 'Gender not specified'}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                {child.metadata?.is_self && (
                                  <span className="badge badge-success">Self</span>
                                )}
                                {child.metadata?.has_user_account && (
                                  <span className="badge badge-primary">Has Account</span>
                                )}
                                {child.metadata?.linked_user_id && (
                                  <span className="badge badge-secondary">Linked User</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/children/${child.id}`)}
                              className="btn btn-ghost btn-sm flex items-center space-x-1"
                            >
                              <FiEye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            {!child.metadata?.is_self && (
                              <button
                                onClick={() => handleDeleteChild(child.id)}
                                className="btn btn-destructive btn-sm flex items-center space-x-1"
                              >
                                <FiTrash2 className="w-4 h-4" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Role-specific Info & Actions */}
          <div className="space-y-6">
            {/* Role Information */}
            <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Role Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Role Type</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {profile.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Last Updated</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(profile.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {profile.role === 'kid' && (
                  <button
                    onClick={() => router.push('/learn')}
                    className="w-full btn btn-ghost justify-start"
                  >
                    <FiBook className="w-4 h-4 mr-2" />
                    Continue Learning
                  </button>
                )}
                {['parent', 'guardian'].includes(profile.role) && (
                  <button
                    onClick={() => router.push('/progress')}
                    className="w-full btn btn-ghost justify-start"
                  >
                    <FiEye className="w-4 h-4 mr-2" />
                    View Progress Reports
                  </button>
                )}
                {['teacher', 'principal', 'class_teacher'].includes(profile.role) && (
                  <button
                    onClick={() => router.push('/classroom')}
                    className="w-full btn btn-ghost justify-start"
                  >
                    <FiUsers className="w-4 h-4 mr-2" />
                    Classroom Management
                  </button>
                )}
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full btn btn-ghost justify-start"
                >
                  <FiSettings className="w-4 h-4 mr-2" />
                  Account Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full btn btn-ghost justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <FiLock className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Children Managed</span>
                  <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                    {children.length}
                  </span>
                </div>
                {profile.metadata?.age && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Your Age</span>
                    <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                      {profile.metadata.age}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
                  <span className="badge badge-success">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}