import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, LineChart, Line, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// MUI imports
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider,
  Collapse,
  Snackbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  FormControlLabel,
  Tooltip as MuiTooltip,
  Badge,
  Stack,
  LinearProgress,
  InputAdornment,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  AppBar,
  Toolbar,
  InputBase,
  Avatar,
  useMediaQuery,
  useTheme as useMuiTheme,
  CircularProgress,
  Menu,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AvatarGroup,
} from '@mui/material';

// MUI Icons
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Image as ImageIcon,
  CalendarToday as CalendarIcon,
  History as HistoryIcon,
  CompareArrows as CompareIcon,
  Dashboard as DashboardIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Keyboard as KeyboardIcon,
  DragIndicator as DragIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ShowChart as ShowChartIcon,
  GridOn as GridOnIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Logout as LogoutIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  ContentCopy as ContentCopyIcon,
  Business as BusinessIcon,
  AdminPanelSettings as AdminIcon,
  RemoveRedEye as ViewerIcon,
  SwapHoriz as SwitchIcon,
} from '@mui/icons-material';

import { theme } from './theme';

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// サイドバーの幅
const DRAWER_WIDTH = 80;

// 認証関連関数
const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  
  if (error) throw error;
  return data;
};

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// 組織管理関数
const createOrganization = async (name, userId) => {
  try {
    console.log('Creating organization:', name, userId);
    
    // 1. 組織を作成
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name, created_by: userId })
      .select()
      .single();
    
    if (orgError) {
      console.error('Organization creation error:', orgError);
      throw orgError;
    }
    
    console.log('Organization created:', org);
    
    // 2. オーナーとして自動追加
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
        joined_at: new Date().toISOString(),
        user_email: currentUser.email,
        user_name: currentUser.user_metadata?.full_name || null,
        user_avatar_url: currentUser.user_metadata?.avatar_url || null
      });
    
    if (memberError) {
      console.error('Member creation error:', memberError);
      throw memberError;
    }
    
    console.log('Owner added successfully');
    
    return org;
  } catch (error) {
    console.error('Failed to create organization:', error);
    throw error;
  }
};

const getUserOrganizations = async (userId) => {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      role,
      organizations (
        id,
        name,
        created_at
      )
    `)
    .eq('user_id', userId);
  
  if (error) throw error;
  return data.map(d => ({ ...d.organizations, role: d.role }));
};

const getOrganizationMembers = async (orgId) => {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', orgId);
  
  if (error) throw error;
  
  return data.map(member => ({
    ...member,
    user: {
      email: member.user_email,
      user_metadata: {
        full_name: member.user_name,
        avatar_url: member.user_avatar_url
      }
    }
  }));
};

const inviteUserToOrganization = async (orgId, email, role, invitedBy) => {
  const { data: existingInvitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('email', email)
    .is('used_at', null)
    .single();
  
  if (existingInvitation) {
    const isExpired = new Date(existingInvitation.expires_at) < new Date();
    
    if (!isExpired) {
      console.log('既存の招待を再利用します');
      return existingInvitation;
    } else {
      await supabase
        .from('invitations')
        .delete()
        .eq('id', existingInvitation.id);
    }
  }
  
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: orgId,
      email,
      role,
      token,
      invited_by: invitedBy,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

const acceptInvitation = async (token, userId) => {
  console.log('Accepting invitation with token:', token);
  
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .single();
  
  console.log('Invitation data:', invitation, invError);
  
  if (invError) {
    console.error('Invitation query error:', invError);
    throw new Error('招待リンクが見つかりません');
  }
  
  if (!invitation) {
    throw new Error('無効な招待リンクです');
  }
  
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('招待リンクの有効期限が切れています');
  }
  
  // 既存メンバーかどうかをチェック
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('organization_id', invitation.organization_id)
    .eq('user_id', userId)
    .single();
  
  if (existingMember) {
    console.log('User is already a member of this organization');
    
    // 招待を既読にする
    await supabase
      .from('invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invitation.id);
    
    // 組織情報を返す（既存メンバーの場合）
    return { 
      ...invitation, 
      isExistingMember: true 
    };
  }
  
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  // 新規メンバーとして追加
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
      joined_at: new Date().toISOString(),
      user_email: currentUser.email,
      user_name: currentUser.user_metadata?.full_name || null,
      user_avatar_url: currentUser.user_metadata?.avatar_url || null
    });
  
  if (memberError) {
    console.error('Member insertion error:', memberError);
    throw new Error('メンバーの追加に失敗しました');
  }
  
  // 招待を既読にする
  const { error: updateError } = await supabase
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invitation.id);
  
  if (updateError) {
    console.error('Invitation update error:', updateError);
  }
  
  console.log('Invitation accepted successfully');
  
  return { 
    ...invitation, 
    isExistingMember: false 
  };
};
  
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
      joined_at: new Date().toISOString(),
      user_email: currentUser.email,
      user_name: currentUser.user_metadata?.full_name || null,
      user_avatar_url: currentUser.user_metadata?.avatar_url || null
    });
  
  if (memberError) {
    console.error('Member insertion error:', memberError);
    throw memberError;
  }
  
  const { error: updateError } = await supabase
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invitation.id);
  
  if (updateError) {
    console.error('Invitation update error:', updateError);
    throw updateError;
  }
  
  console.log('Invitation accepted successfully');
  
  return invitation;


const removeMember = async (memberId) => {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);
  
  if (error) throw error;
};

const deleteOrganization = async (orgId) => {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId);
  
  if (error) throw error;
};

// 組織選択モーダル
function OrganizationSelectorModal({ open, onClose, organizations, onSelect, onCreateNew }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BusinessIcon color="primary" />
          <Typography variant="h6">組織を選択</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {organizations.map(org => (
            <Card
              key={org.id}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3,
                  borderColor: 'primary.main',
                },
                border: '1px solid',
                borderColor: 'divider',
              }}
              onClick={() => onSelect(org)}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{org.name}</Typography>
                    <Chip
                      label={org.role === 'owner' ? 'オーナー' : org.role === 'admin' ? '管理者' : org.role === 'member' ? 'メンバー' : '閲覧者'}
                      size="small"
                      color={org.role === 'owner' ? 'primary' : org.role === 'admin' ? 'secondary' : 'default'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <CheckIcon color="action" />
                </Stack>
              </CardContent>
            </Card>
          ))}
          
          {organizations.length === 0 && (
            <Alert severity="info">
              まだ組織に参加していません。新しい組織を作成してください。
            </Alert>
          )}
          
          <Divider sx={{ my: 2 }}>または</Divider>
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
            fullWidth
            size="large"
          >
            新しい組織を作成
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

// 組織作成モーダル
function CreateOrganizationModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await onCreate(name);
      setName('');
      onClose();
    } catch (error) {
      console.error('Organization creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新しい組織を作成</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="組織名"
          placeholder="例: 株式会社サンプル"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 2 }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!name.trim() || loading}
        >
          {loading ? '作成中...' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// 通知モーダル
function NotificationsModal({ open, onClose, notifications, onMarkAsRead, onMarkAllAsRead }) {
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'evaluation_updated':
        return <EditIcon fontSize="small" color="primary" />;
      case 'member_added':
        return <PersonAddIcon fontSize="small" color="success" />;
      case 'member_removed':
        return <DeleteIcon fontSize="small" color="error" />;
      case 'member_invited':
        return <EmailIcon fontSize="small" color="info" />;
      case 'criteria_updated':
        return <EditIcon fontSize="small" color="secondary" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6">通知</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            {notifications.some(n => !n.is_read) && (
              <Button size="small" onClick={onMarkAllAsRead}>
                全て既読
              </Button>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {notifications.length === 0 ? (
          <Alert severity="info">通知はありません</Alert>
        ) : (
          <List>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                  borderRadius: 1,
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
                onClick={() => {
                  if (!notification.is_read) {
                    onMarkAsRead(notification.id);
                  }
                }}
              >
                <ListItemIcon>
                  {getActionIcon(notification.action_type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={notification.is_read ? 400 : 600}>
                        {notification.message}
                      </Typography>
                      {!notification.is_read && (
                        <Chip label="未読" size="small" color="primary" sx={{ height: 18 }} />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.created_at).toLocaleString('ja-JP')}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

// チームメンバー管理モーダル
function TeamMembersModal({ open, onClose, organization, members, onInvite, onRemove, currentUserId }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showInviteLink, setShowInviteLink] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setLoading(true);
    try {
      const invitation = await onInvite(inviteEmail, inviteRole);
      const link = `${window.location.origin}/invite/${invitation.token}`;
      setInviteLink(link);
      setShowInviteLink(true);
      setInviteEmail('');
    } catch (error) {
      console.error('Invitation error:', error);
      alert('招待に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('リンクをコピーしました!');
  };

  const currentUserRole = members.find(m => m.user_id === currentUserId)?.role;
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <GroupIcon color="primary" />
            <Typography variant="h6">{organization?.name} - メンバー管理</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {canManageMembers && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  メンバーを招待
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="メールアドレス"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>権限</InputLabel>
                      <Select
                        value={inviteRole}
                        label="権限"
                        onChange={(e) => setInviteRole(e.target.value)}
                      >
                        <MenuItem value="admin">管理者</MenuItem>
                        <MenuItem value="member">メンバー</MenuItem>
                        <MenuItem value="viewer">閲覧者</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={handleInvite}
                      disabled={loading || !inviteEmail.trim()}
                    >
                      招待
                    </Button>
                  </Grid>
                </Grid>

                {showInviteLink && (
                  <Alert
                    severity="success"
                    sx={{ mt: 2 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={copyInviteLink}
                      >
                        コピー
                      </Button>
                    }
                  >
                    招待リンクを生成しました。このリンクをメンバーに送信してください。
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, wordBreak: 'break-all', fontSize: '0.875rem' }}>
                      {inviteLink}
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                権限について
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label="オーナー" size="small" color="primary" />
                  <Typography variant="caption">全ての操作が可能。組織の削除も可能。</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label="管理者" size="small" color="secondary" />
                  <Typography variant="caption">メンバー管理・データ編集が可能。</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label="メンバー" size="small" />
                  <Typography variant="caption">データの閲覧・編集が可能。</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label="閲覧者" size="small" />
                  <Typography variant="caption">データの閲覧のみ可能。</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>メンバー</TableCell>
                  <TableCell>権限</TableCell>
                  <TableCell>参加日</TableCell>
                  <TableCell align="right">アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          src={member.user?.user_metadata?.avatar_url}
                          sx={{ width: 32, height: 32 }}
                        >
                          {member.user?.email?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {member.user?.user_metadata?.full_name || member.user?.email || '不明なユーザー'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.user?.email || ''}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          member.role === 'owner' ? 'オーナー' :
                          member.role === 'admin' ? '管理者' :
                          member.role === 'member' ? 'メンバー' : '閲覧者'
                        }
                        size="small"
                        color={
                          member.role === 'owner' ? 'primary' :
                          member.role === 'admin' ? 'secondary' : 'default'
                        }
                        icon={
                          member.role === 'owner' ? <AdminIcon /> :
                          member.role === 'admin' ? <AdminIcon /> :
                          member.role === 'viewer' ? <ViewerIcon /> : <PersonIcon />
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(member.joined_at).toLocaleDateString('ja-JP')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {canManageMembers && member.role !== 'owner' && member.user_id !== currentUserId && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm('本当にこのメンバーを削除しますか?')) {
                              onRemove(member.id);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

// ログイン画面コンポーネント
function LoginScreen({ onSignIn }) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await onSignIn();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '90%', p: 4 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              PS
            </Avatar>
            <Typography variant="h4" gutterBottom fontWeight={700}>
              PS能力評価チャート
            </Typography>
            <Typography variant="body2" color="text.secondary">
              10の能力を5段階で評価し、視覚的に強み・弱みを把握する
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSignIn}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              },
            }}
          >
            {loading ? 'ログイン中...' : 'Googleでログイン'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

// トースト通知コンポーネント(MUI版)
function ToastNotification({ open, message, severity, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant="filled"
        sx={{ width: '100%', minWidth: 300 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

// キーボードショートカットヘルプモーダル(MUI版)
function KeyboardShortcutsModal({ isOpen, onClose }) {
  const shortcuts = [
    { key: 'Ctrl + S', description: 'データを保存' },
    { key: 'Ctrl + E', description: 'データをエクスポート' },
    { key: '1-5', description: 'タブ切り替え' },
    { key: 'Ctrl + M', description: 'メンバー追加' },
    { key: 'Esc', description: 'モーダルを閉じる' },
    { key: '?', description: 'このヘルプを表示' }
  ];

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyboardIcon color="primary" />
        <Typography variant="h6" component="span">
          キーボードショートカット
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ ml: 'auto' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <List>
          {shortcuts.map((shortcut, idx) => (
            <ListItem
              key={idx}
              divider={idx < shortcuts.length - 1}
              sx={{ py: 2 }}
            >
              <ListItemText 
                primary={shortcut.description}
                primaryTypographyProps={{ variant: 'body2' }}
              />
              <Chip 
                label={shortcut.key}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
              />
            </ListItem>
          ))}
        </List>
        <Alert severity="info" sx={{ mt: 2 }}>
          ヒント: いつでも <strong>?</strong> キーでこのヘルプを表示できます
        </Alert>
      </DialogContent>
    </Dialog>
  );
}

// 評価基準カスタマイズモーダル
function CriteriaSettingsModal({ open, onClose, criteria, onSave }) {
  const [editedCriteria, setEditedCriteria] = useState(criteria);

  useEffect(() => {
    setEditedCriteria(criteria);
  }, [criteria]);

  const handleSave = () => {
    onSave(editedCriteria);
    onClose();
  };

  const updateCriteriaLevel = (competencyKey, level, description) => {
    setEditedCriteria(prev => ({
      ...prev,
      [competencyKey]: {
        ...prev[competencyKey],
        levels: {
          ...prev[competencyKey].levels,
          [level]: description
        }
      }
    }));
  };

  const updateCriteriaName = (competencyKey, newName) => {
    setEditedCriteria(prev => ({
      ...prev,
      [competencyKey]: {
        ...prev[competencyKey],
        name: newName
      }
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">評価基準のカスタマイズ</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {Object.entries(editedCriteria).map(([key, competency]) => (
            <Card key={key} variant="outlined">
              <CardContent>
                <TextField
                  fullWidth
                  label="能力名"
                  value={competency.name}
                  onChange={(e) => updateCriteriaName(key, e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Stack spacing={2}>
                  {Object.entries(competency.levels).map(([level, description]) => (
                    <TextField
                      key={level}
                      fullWidth
                      multiline
                      rows={2}
                      label={`レベル ${level}`}
                      value={description}
                      onChange={(e) => updateCriteriaLevel(key, level, e.target.value)}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleSave}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

// 設定モーダル
function SettingsModal({ open, onClose, settings, onSave }) {
  const [editedSettings, setEditedSettings] = useState(settings);
  const [logoPreview, setLogoPreview] = useState(settings.logoUrl);

  useEffect(() => {
    setEditedSettings(settings);
    setLogoPreview(settings.logoUrl);
  }, [settings, open]);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      setEditedSettings(prev => ({ ...prev, logoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave(editedSettings);
    onClose();
  };

  const handleLabelChange = (key, value) => {
    setEditedSettings(prev => ({
      ...prev,
      labels: {
        ...prev.labels,
        [key]: value
      }
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">設定</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* ロゴ設定 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              ロゴ画像
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={logoPreview}
                sx={{
                  width: 80,
                  height: 80,
                  background: logoPreview ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {!logoPreview && 'PS'}
              </Avatar>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
              >
                画像を選択
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleLogoChange}
                />
              </Button>
              {logoPreview && editedSettings.logoUrl && (
                <Button
                  variant="text"
                  color="error"
                  onClick={() => {
                    setLogoPreview(null);
                    setEditedSettings(prev => ({ ...prev, logoUrl: null }));
                  }}
                >
                  削除
                </Button>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* アプリケーション名 */}
          <TextField
            fullWidth
            label="アプリケーション名"
            value={editedSettings.appName}
            onChange={(e) => setEditedSettings(prev => ({ ...prev, appName: e.target.value }))}
          />

          <Divider />

          {/* 編集可能なラベル */}
          <Typography variant="subtitle2" gutterBottom>
            画面ラベルのカスタマイズ
          </Typography>

          <TextField
            fullWidth
            label="チャートタイトル"
            value={editedSettings.labels?.chartTitle || '📊 能力レーダーチャート'}
            onChange={(e) => handleLabelChange('chartTitle', e.target.value)}
            helperText="チャート上部に表示されるタイトル"
          />

          <TextField
            fullWidth
            label="評価基準セクションタイトル"
            value={editedSettings.labels?.criteriaTitle || '📋 能力評価基準'}
            onChange={(e) => handleLabelChange('criteriaTitle', e.target.value)}
            helperText="評価基準セクションのタイトル"
          />

          <TextField
            fullWidth
            label="チームメモセクションタイトル"
            value={editedSettings.labels?.teamMemoTitle || '📝 チーム全体のメモ'}
            onChange={(e) => handleLabelChange('teamMemoTitle', e.target.value)}
            helperText="チームメモエリアのタイトル"
          />

          <TextField
            fullWidth
            label="メンバー管理セクションタイトル"
            value={editedSettings.labels?.memberManagementTitle || 'メンバー管理'}
            onChange={(e) => handleLabelChange('memberManagementTitle', e.target.value)}
            helperText="メンバーリストのタイトル"
          />

          <TextField
            fullWidth
            label="理想形セクションタイトル"
            value={editedSettings.labels?.idealProfileTitle || '理想形'}
            onChange={(e) => handleLabelChange('idealProfileTitle', e.target.value)}
            helperText="理想形カードのタイトル"
          />

          <Divider />

          {/* 自動保存設定 */}
          <FormControlLabel
            control={
              <Switch
                checked={editedSettings.autoSave}
                onChange={(e) => setEditedSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
              />
            }
            label="自動保存を有効にする"
          />

          {/* 自動保存間隔 */}
          {editedSettings.autoSave && (
            <TextField
              fullWidth
              type="number"
              label="自動保存間隔(分)"
              value={editedSettings.autoSaveInterval}
              onChange={(e) => setEditedSettings(prev => ({ ...prev, autoSaveInterval: parseInt(e.target.value) }))}
              InputProps={{
                inputProps: { min: 1, max: 60 }
              }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleSave}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

// ドラッグ可能なメンバーカード(MUI版)
function SortableEmployeeCard({ 
  emp, 
  competencyNames, 
  selectedEmployees, 
  toggleEmployee, 
  removeEmployee, 
  handleScoreChange, 
  handleEmployeeMemoChange, 
  calculateAverage, 
  getStrengthsAndWeaknesses, 
  setEmployees,
  isReadOnly
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: emp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { strengths, weaknesses } = getStrengthsAndWeaknesses(emp.scores);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          borderColor: 'primary.light',
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* ヘッダー */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          {!isReadOnly && (
            <IconButton {...attributes} {...listeners} size="small" sx={{ cursor: 'grab', color: 'text.secondary' }}>
              <DragIcon fontSize="small" />
            </IconButton>
          )}
          
          <IconButton
            size="small"
            onClick={() => {
              setEmployees(prev => prev.map(employee => 
                employee.id === emp.id ? { ...employee, isExpanded: !employee.isExpanded } : employee
              ));
            }}
            sx={{ color: 'text.secondary' }}
          >
            {emp.isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>

          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: emp.color, flexShrink: 0 }} />

          <TextField
            value={emp.name}
            onChange={(e) => {
              if (!isReadOnly) {
                setEmployees(prev => prev.map(employee => 
                  employee.id === emp.id ? { ...employee, name: e.target.value } : employee
                ));
              }
            }}
            variant="standard"
            disabled={isReadOnly}
            sx={{
              flex: 1,
              '& .MuiInput-input': {
                fontSize: '1rem',
                fontWeight: 600,
              }
            }}
          />

          <Chip 
            label={calculateAverage(emp.scores)} 
            size="small" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              minWidth: 42,
            }}
          />

          <IconButton
            size="small"
            onClick={() => toggleEmployee(emp.id)}
            sx={{ color: selectedEmployees.includes(emp.id) ? 'primary.main' : 'text.secondary' }}
          >
            {selectedEmployees.includes(emp.id) ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
          </IconButton>

          {!isReadOnly && (
            <IconButton size="small" color="error" onClick={() => removeEmployee(emp.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {/* 統計 */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
          <Chip 
            label={`💪 ${strengths[0]?.name}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24, borderColor: '#10b981', color: '#059669' }}
          />
          <Chip 
            label={`📈 ${weaknesses[0]?.name}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24, borderColor: '#f59e0b', color: '#d97706' }}
          />
        </Stack>

        {/* 展開エリア */}
        <Collapse in={emp.isExpanded}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={1.5}>
            {Object.entries(competencyNames).map(([key, name]) => (
              <Grid item xs={6} key={key}>
                <FormControl fullWidth size="small" disabled={isReadOnly}>
                  <InputLabel sx={{ fontSize: '0.875rem' }}>{name}</InputLabel>
                  <Select
                    value={emp.scores[key]}
                    label={name}
                    onChange={(e) => !isReadOnly && handleScoreChange(emp.id, key, e.target.value)}
                  >
                    {[1, 2, 3, 4, 5].map(level => (
                      <MenuItem key={level} value={level}>Lv.{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="メモ..."
            value={emp.memo || ''}
            onChange={(e) => !isReadOnly && handleEmployeeMemoChange(emp.id, e.target.value)}
            disabled={isReadOnly}
            sx={{ mt: 2 }}
          />
        </Collapse>
      </CardContent>
    </Card>
  );
}

// ActionBar コンポーネント
// ActionBar コンポーネント
function ActionBar({
  isSaving,
  isOnline,
  hasUnsavedChanges,
  lastSaved,
  onSave,
  onExportSVG,
  onExportJSON,
  onImport,
  onShowKeyboardHelp,
  onAddMember,
  showIdeal,
  onToggleIdeal,
  chartType,
  onChartTypeChange,
  isReadOnly,
  settings,
  onOpenSettings,
  // 履歴保存用の新しいprops
  onSaveHistory,
  evaluationDate,
  onEvaluationDateChange,
  evaluationMemo,
  onEvaluationMemoChange,
}) {
  const [showHistorySave, setShowHistorySave] = React.useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={2}>
        {/* 上段: タイトルとステータス */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography 
              variant="h5" 
              onClick={onOpenSettings}
              sx={{ 
                fontWeight: 500, 
                mb: 0.5,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {settings.appName || '評価チャート'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              10の能力を5段階で評価し、視覚的に強み・弱みを把握する
            </Typography>
          </Box>

          {/* ステータス */}
          <Stack direction="row" spacing={1} alignItems="center">
            {isReadOnly && (
              <Chip
                icon={<ViewerIcon />}
                label="閲覧専用"
                size="small"
                color="default"
                variant="outlined"
              />
            )}
            {lastSaved && (
              <Typography variant="caption" color="text.secondary">
                {lastSaved.toLocaleTimeString('ja-JP')}
              </Typography>
            )}
            <Chip
              icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
              label={
                hasUnsavedChanges ? '未保存' : isOnline ? 'オンライン' : 'オフライン'
              }
              color={
                isOnline && !hasUnsavedChanges
                  ? 'success'
                  : hasUnsavedChanges
                  ? 'warning'
                  : 'error'
              }
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>

        <Divider />

        {/* 下段: アクション */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* 左側: 主要アクション */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            {!isReadOnly && (
              <>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onAddMember}
                  sx={{ borderRadius: 2 }}
                >
                  メンバー追加
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  onClick={onSave}
                  disabled={isSaving}
                  sx={{ borderRadius: 2 }}
                >
                  {isSaving ? '保存中...' : '保存'}
                </Button>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              </>
            )}

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onExportJSON}
              sx={{ borderRadius: 2 }}
            >
              JSON
            </Button>

            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={onExportSVG}
              sx={{ borderRadius: 2 }}
            >
              SVG
            </Button>

            {!isReadOnly && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  インポート
                  <input type="file" accept=".json" onChange={onImport} hidden />
                </Button>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                {/* 履歴保存ボタン */}
                <Button
                  variant="outlined"
                  startIcon={<CalendarIcon />}
                  onClick={() => setShowHistorySave(!showHistorySave)}
                  sx={{ borderRadius: 2 }}
                  color={showHistorySave ? 'primary' : 'inherit'}
                >
                  履歴保存
                </Button>
              </>
            )}
          </Stack>

          {/* 右側: ビューコントロール */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }} useFlexGap>
            <MuiTooltip title="キーボードショートカット">
              <IconButton size="small" onClick={onShowKeyboardHelp}>
                <KeyboardIcon />
              </IconButton>
            </MuiTooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', sm: 'block' } }} />

            <Chip
              label="理想形"
              onClick={onToggleIdeal}
              color={showIdeal ? 'primary' : 'default'}
              variant={showIdeal ? 'filled' : 'outlined'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />

            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                bgcolor: 'action.hover',
                borderRadius: 2,
              }}
            >
              <Button
                size="small"
                variant={chartType === 'radar' ? 'contained' : 'text'}
                onClick={() => onChartTypeChange('radar')}
                sx={{
                  minWidth: 80,
                  borderRadius: 1.5,
                  py: 0.5,
                }}
              >
                レーダー
              </Button>
              <Button
                size="small"
                variant={chartType === 'scatter' ? 'contained' : 'text'}
                onClick={() => onChartTypeChange('scatter')}
                sx={{
                  minWidth: 80,
                  borderRadius: 1.5,
                  py: 0.5,
                }}
              >
                マトリクス
              </Button>
            </Box>
          </Stack>
        </Box>

        {/* 履歴保存フォーム（展開時） */}
        {!isReadOnly && (
          <Collapse in={showHistorySave}>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="評価日"
                  type="date"
                  value={evaluationDate}
                  onChange={(e) => onEvaluationDateChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ width: 180 }}
                />
                <TextField
                  label="メモ"
                  placeholder="Q1評価"
                  value={evaluationMemo}
                  onChange={(e) => onEvaluationMemoChange(e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    onSaveHistory();
                    setShowHistorySave(false);
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    }
                  }}
                >
                  履歴に保存
                </Button>
              </Stack>
            </Box>
          </Collapse>
        )}
      </Stack>
    </Paper>
  );
}

// MainLayout コンポーネント
function MainLayout({ 
  children, 
  viewMode, 
  setViewMode, 
  user, 
  onSignOut, 
  searchQuery, 
  setSearchQuery, 
  settings, 
  onOpenSettings,
  currentOrganization,
  onOpenTeamMembers,
  onSwitchOrganization,
  organizationMembers,
  onDeleteOrganization,
  notifications,
  unreadCount,
  onOpenNotifications,
}) {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleMenuClose();
    onSignOut();
  };

  const handleDeleteOrganization = () => {
    onDeleteOrganization();
  };

  const menuItems = [
    { id: 'current', icon: <HomeIcon />, label: '現在の評価' },
    { id: 'history', icon: <HistoryIcon />, label: '成長履歴' },
    { id: 'compare', icon: <CompareIcon />, label: '履歴比較' },
    { id: 'comparison', icon: <TrendingUpIcon />, label: '時系列比較' },
    { id: 'dashboard', icon: <DashboardIcon />, label: 'チーム分析' },
  ];

  const drawer = (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        py: 2,
      }}
    >
      <Box sx={{ px: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Avatar 
          src={settings.logoUrl}
          onClick={onOpenSettings}
          sx={{ 
            width: 48,
            height: 48,
            background: settings.logoUrl ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: '1.25rem',
            fontWeight: 700,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
        >
          {!settings.logoUrl && (settings.appName?.[0] || 'PS')}
        </Avatar>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ flex: 1, px: 1.5 }}>
        {menuItems.map((item) => (
          <MuiTooltip key={item.id} title={item.label} placement="right" arrow>
            <IconButton
              onClick={() => {
                setViewMode(item.id);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                width: '100%',
                height: 56,
                borderRadius: 3,
                mb: 1,
                color: viewMode === item.id ? 'primary.main' : 'text.secondary',
                bgcolor: viewMode === item.id ? 'primary.50' : 'transparent',
                '&:hover': {
                  bgcolor: viewMode === item.id ? 'primary.100' : 'action.hover',
                },
                transition: 'all 0.2s',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.75rem',
                }
              }}
            >
              {item.icon}
            </IconButton>
          </MuiTooltip>
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ px: 1.5, mb: 1 }}>
        <MuiTooltip title="チーム管理" placement="right" arrow>
          <IconButton
            onClick={onOpenTeamMembers}
            sx={{
              width: '100%',
              height: 56,
              borderRadius: 3,
              color: 'text.secondary',
              '& .MuiSvgIcon-root': {
                fontSize: '1.75rem',
              }
            }}
          >
            <Badge badgeContent={organizationMembers.length} color="primary">
              <GroupIcon />
            </Badge>
          </IconButton>
        </MuiTooltip>
      </Box>

      <Box sx={{ px: 1.5 }}>
        <MuiTooltip title="設定" placement="right" arrow>
          <IconButton
            onClick={onOpenSettings}
            sx={{
              width: '100%',
              height: 56,
              borderRadius: 3,
              color: 'text.secondary',
              '& .MuiSvgIcon-root': {
                fontSize: '1.75rem',
              }
            }}
          >
            <SettingsIcon />
          </IconButton>
        </MuiTooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="action" />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {currentOrganization?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentOrganization?.role === 'owner' ? 'オーナー' : 
                 currentOrganization?.role === 'admin' ? '管理者' : 
                 currentOrganization?.role === 'member' ? 'メンバー' : '閲覧者'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onSwitchOrganization}>
              <SwitchIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
              mr: 2,
              width: { xs: '100%', sm: 'auto' },
              flex: { sm: 1 },
              maxWidth: 600,
            }}
          >
            <Box
              sx={{
                padding: muiTheme.spacing(0, 2),
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon />
            </Box>
            <InputBase
              placeholder="メンバー・能力・メモで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                color: 'inherit',
                width: '100%',
                '& .MuiInputBase-input': {
                  padding: muiTheme.spacing(1.5, 1.5, 1.5, 0),
                  paddingLeft: `calc(1em + ${muiTheme.spacing(4)})`,
                  fontSize: '0.875rem',
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <MuiTooltip title="チームメンバー">
              <IconButton onClick={onOpenTeamMembers}>
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.875rem' } }}>
                  {organizationMembers.slice(0, 3).map((member, idx) => (
                    <Avatar
                      key={idx}
                      src={member.user?.user_metadata?.avatar_url}
                      sx={{ width: 28, height: 28 }}
                    >
                      {member.user?.email?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                  ))}
                </AvatarGroup>
              </IconButton>
            </MuiTooltip>

            <IconButton color="inherit" onClick={onOpenNotifications}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={handleMenuOpen}>
              <Avatar 
                src={user?.user_metadata?.avatar_url}
                sx={{ width: 32, height: 32 }}
              >
                {user?.email?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Box sx={{ px: 2, py: 1.5, minWidth: 200 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.user_metadata?.full_name || user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={onSwitchOrganization}>
              <ListItemIcon>
                <SwitchIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>組織を切り替え</ListItemText>
            </MenuItem>
            
            {currentOrganization?.role === 'owner' && (
              <MenuItem 
                onClick={() => {
                  handleMenuClose();
                  if (window.confirm(`本当に「${currentOrganization.name}」を削除しますか?\n\nこの操作は取り消せません。すべてのデータが完全に削除されます。`)) {
                    handleDeleteOrganization();
                  }
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>組織を削除</ListItemText>
              </MenuItem>
            )}
            
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>ログアウト</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

// メインアプリケーション
function App() {
  // 認証State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 組織State
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showTeamMembers, setShowTeamMembers] = useState(false);

  // State管理
  const [employees, setEmployees] = useState([
    { id: 1, name: 'メンバーA', color: '#3b82f6', scores: { dataAnalysis: 3, problemSolving: 4, techKnowledge: 3, learnSpeed: 4, creativity: 3, planning: 3, communication: 4, support: 3, management: 2, strategy: 3 }, isExpanded: false, memo: '' }
  ]);
  
  const [idealProfile, setIdealProfile] = useState({ dataAnalysis: 5, problemSolving: 5, techKnowledge: 5, learnSpeed: 5, creativity: 5, planning: 5, communication: 5, support: 5, management: 5, strategy: 5, isExpanded: false });
  const [showIdeal, setShowIdeal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([1]);
  const [chartType, setChartType] = useState('radar');
  const [viewMode, setViewMode] = useState('current');
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [newEvaluationDate, setNewEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEvaluationMemo, setNewEvaluationMemo] = useState('');
  const [teamMemo, setTeamMemo] = useState('');
  const [showCriteria, setShowCriteria] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCriteriaSettings, setShowCriteriaSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const chartRef = useRef(null);
  const nextId = useRef(2);

  // UI状態の管理（折りたたみ状態）
  const [uiState, setUiState] = useState({
    showCriteria: false,
    showTeamMemo: false,
    showIdealProfile: false,
    showMemberList: true,
  });

  // 設定State
  const [settings, setSettings] = useState({
    logoUrl: null,
    appName: 'PS能力評価チャート',
    autoSave: true,
    autoSaveInterval: 1,
    labels: {
      chartTitle: '📊 能力レーダーチャート',
      criteriaTitle: '📋 能力評価基準',
      teamMemoTitle: '📝 チーム全体のメモ',
      memberManagementTitle: 'メンバー管理',
      idealProfileTitle: '理想形'
    }
  });

  // 能力名の定義
  const [competencyNames, setCompetencyNames] = useState({
    dataAnalysis: 'データ分析力',
    problemSolving: '問題解決力',
    techKnowledge: '技術知識',
    learnSpeed: '学習速度',
    creativity: '創造性',
    planning: '計画立案力',
    communication: 'コミュニケーション力',
    support: '伴走支援力',
    management: 'マネジメント力',
    strategy: '戦略立案力'
  });

  // 能力評価基準
  const [competencyCriteria, setCompetencyCriteria] = useState({
    dataAnalysis: {
      name: "データ分析力",
      levels: {
        1: "基本的な集計ができる。",
        2: "ピボットテーブル等で多角的な分析ができる。",
        3: "データから仮説を立て検証できる。",
        4: "統計的手法を用いた高度な分析ができる。",
        5: "分析結果から戦略的示唆を導き出せる。"
      }
    },
    problemSolving: {
      name: "問題解決力",
      levels: {
        1: "問題を認識し報告できる。",
        2: "原因を特定し解決策を提案できる。",
        3: "複数の解決策を比較検討できる。",
        4: "関係者を巻き込み問題解決できる。",
        5: "組織的な問題解決の仕組みを作れる。"
      }
    },
    techKnowledge: {
      name: "技術知識",
      levels: {
        1: "基本的なツールを使用できる。",
        2: "業務に必要な技術を理解している。",
        3: "新しい技術を自律的に習得できる。",
        4: "技術的な判断と提案ができる。",
        5: "技術戦略を立案できる。"
      }
    },
    learnSpeed: {
      name: "学習速度",
      levels: {
        1: "指導を受けながら学習できる。",
        2: "自律的に学習できる。",
        3: "効率的な学習方法を確立している。",
        4: "他者の学習を支援できる。",
        5: "組織の学習文化を醸成できる。"
      }
    },
    creativity: {
      name: "創造性",
      levels: {
        1: "既存の方法を理解し実行できる。",
        2: "改善案を提案できる。",
        3: "新しいアプローチを考案できる。",
        4: "革新的なソリューションを生み出せる。",
        5: "イノベーションを組織に浸透させられる。"
      }
    },
    planning: {
      name: "計画立案力",
      levels: {
        1: "タスクを期限内に完了できる。",
        2: "プロジェクトの計画を立てられる。",
        3: "リスクを考慮した計画ができる。",
        4: "複数プロジェクトを統合管理できる。",
        5: "中長期的な戦略計画を立案できる。"
      }
    },
    management: {
      name: "マネジメント力",
      levels: {
        1: "担当業務を最後まで実行出来る",
        2: "担当する業務の費用対効果を意識しながら行動出来る",
        3: "採用や事業に関して、必要な行動が取れる",
        4: "事業の拡大に必要な予算等を把握し、そのための新規採用等の必要性を説明できる",
        5: "新規事業に関して、余白等を理解し、進行することができる"
      }
    },
    strategy: {
      name: "戦略立案力",
      levels: {
        1: "稼働の改善のための方法を理解している。",
        2: "部分的な施策を立案できる。",
        3: "中長期的な視点で施策を立案できる。",
        4: "事業全体を見据えた戦略を立案できる。",
        5: "組織全体の方向性を示す戦略を策定できる。"
      }
    },
    communication: {
      name: "コミュニケーション力",
      levels: {
        1: "報連相ができる。基本的な情報共有ができる。",
        2: "相手に合わせた説明ができる。円滑に意思疎通できる。",
        3: "複雑な内容を分かりやすく伝えられる。合意形成ができる。",
        4: "ステークホルダーを巻き込み、プロジェクトを推進できる。",
        5: "組織全体のコミュニケーションを活性化させられる。"
      }
    },
    support: {
      name: "伴走支援力",
      levels: {
        1: "指示されたサポートができる。",
        2: "相手の状況に応じた支援ができる。",
        3: "自律的な成長を促す支援ができる。",
        4: "組織全体の成長を見据えた育成ができる。",
        5: "育成の仕組みを作り、組織能力を向上させられる。"
      }
    }
  });

  // 権限チェック
  const isReadOnly = currentOrganization?.role === 'viewer';
  const canManageMembers = currentOrganization?.role === 'owner' || currentOrganization?.role === 'admin';

  // トースト追加関数
  const addToast = (message, severity = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, severity }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 検索フィルター関数
  const filterEmployeesBySearch = (employees) => {
    if (!searchQuery.trim()) return employees;
    
    const query = searchQuery.toLowerCase();
    return employees.filter(emp => {
      if (emp.name.toLowerCase().includes(query)) return true;
      if (emp.memo && emp.memo.toLowerCase().includes(query)) return true;
      
      const matchesCompetency = Object.entries(competencyNames).some(([key, name]) => 
        name.toLowerCase().includes(query)
      );
      
      return matchesCompetency;
    });
  };

  // 通知を作成する関数
  const createNotification = async (actionType, message, metadata = {}) => {
    if (!user || !currentOrganization) return;
    
    try {
      const otherMembers = organizationMembers.filter(m => m.user_id !== user.id);
      
      // 詳細な通知メッセージを生成
      let detailedMessage = message;
      
      if (actionType === 'evaluation_updated' && metadata.changes) {
        const changeDetails = [];
        if (metadata.changes.memberCount) {
          changeDetails.push(`メンバー数: ${metadata.changes.memberCount}`);
        }
        if (metadata.changes.updatedMembers) {
          changeDetails.push(`更新したメンバー: ${metadata.changes.updatedMembers.join(', ')}`);
        }
        if (changeDetails.length > 0) {
          detailedMessage += ` (${changeDetails.join(', ')})`;
        }
      }
      
      const notificationsToInsert = otherMembers.map(member => ({
        organization_id: currentOrganization.id,
        user_id: member.user_id,
        actor_id: user.id,
        actor_name: user.user_metadata?.full_name || user.email,
        actor_email: user.email,
        action_type: actionType,
        message: detailedMessage,
        metadata: JSON.stringify(metadata),
        is_read: false
      }));
      
      if (notificationsToInsert.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .insert(notificationsToInsert);
        
        if (error) console.error('Notification creation error:', error);
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  // 通知を読み込む関数
  const loadNotifications = async () => {
    if (!user || !currentOrganization) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // 通知を既読にする関数
  const markNotificationAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // 全ての通知を既読にする関数
  const markAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // 組織関連ハンドラー
  const loadUserOrganizations = async () => {
    if (!user) return;
    
    try {
      const orgs = await getUserOrganizations(user.id);
      console.log('Loaded organizations:', orgs);
      setOrganizations(orgs);
      
      if (orgs.length > 0) {
        if (!currentOrganization) {
          setCurrentOrganization(orgs[0]);
        }
        setShowOrgSelector(false);
      } else {
        setShowOrgSelector(false);
        setShowCreateOrg(true);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      addToast('組織の読み込みに失敗しました', 'error');
    }
  };

  const handleCreateOrganization = async (name) => {
    try {
      console.log('handleCreateOrganization called with:', name);
      const org = await createOrganization(name, user.id);
      console.log('Organization created:', org);
      
      const orgWithRole = { ...org, role: 'owner' };
      
      setOrganizations(prev => [...prev, orgWithRole]);
      setCurrentOrganization(orgWithRole);
      
      setShowCreateOrg(false);
      setShowOrgSelector(false);
      
      addToast('組織を作成しました', 'success');
      
      setTimeout(() => {
        loadFromSupabase();
      }, 500);
      
    } catch (error) {
      console.error('Failed to create organization:', error);
      addToast('組織の作成に失敗しました: ' + error.message, 'error');
    }
  };

  const handleDeleteOrganization = async () => {
    if (!currentOrganization) return;
    
    try {
      await deleteOrganization(currentOrganization.id);
      
      setOrganizations(prev => prev.filter(org => org.id !== currentOrganization.id));
      setCurrentOrganization(null);
      
      addToast('組織を削除しました', 'success');
      
      const remainingOrgs = organizations.filter(org => org.id !== currentOrganization.id);
      if (remainingOrgs.length > 0) {
        setCurrentOrganization(remainingOrgs[0]);
      } else {
        setShowCreateOrg(true);
      }
    } catch (error) {
      console.error('Failed to delete organization:', error);
      addToast('組織の削除に失敗しました: ' + error.message, 'error');
    }
  };

  const handleSelectOrganization = (org) => {
    setCurrentOrganization(org);
    setShowOrgSelector(false);
    addToast(`${org.name}に切り替えました`, 'info');
  };

  const loadOrganizationMembers = async () => {
    if (!currentOrganization) return;
    
    try {
      const members = await getOrganizationMembers(currentOrganization.id);
      setOrganizationMembers(members);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleInviteMember = async (email, role) => {
    try {
      const invitation = await inviteUserToOrganization(
        currentOrganization.id,
        email,
        role,
        user.id
      );
      
      // 招待通知を作成
      await createNotification(
        'member_invited',
        `${user.user_metadata?.full_name || user.email}が${email}を招待しました`,
        { email, role }
      );
      
      addToast('招待リンクを生成しました', 'success');
      return invitation;
    } catch (error) {
      console.error('Failed to invite member:', error);
      addToast('招待に失敗しました', 'error');
      throw error;
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      // 削除するメンバーの情報を取得
      const memberToRemove = organizationMembers.find(m => m.id === memberId);
      
      await removeMember(memberId);
      await loadOrganizationMembers();
      
      // 削除通知を作成
      await createNotification(
        'member_removed',
        `${user.user_metadata?.full_name || user.email}が${memberToRemove?.user?.email || 'メンバー'}を削除しました`,
        { removedMemberEmail: memberToRemove?.user?.email }
      );
      
      addToast('メンバーを削除しました', 'info');
    } catch (error) {
      console.error('Failed to remove member:', error);
      addToast('メンバーの削除に失敗しました', 'error');
    }
  };

  // 既存の関数群
  const calculateAverage = (scores) => {
    const values = Object.values(scores).filter(v => typeof v === 'number');
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const getStrengthsAndWeaknesses = (scores) => {
    const scoredCompetencies = Object.entries(scores)
      .filter(([key]) => key !== 'isExpanded')
      .map(([key, value]) => ({ key, name: competencyNames[key], value }))
      .sort((a, b) => b.value - a.value);
    
    return {
      strengths: scoredCompetencies.slice(0, 3),
      weaknesses: scoredCompetencies.slice(-3).reverse()
    };
  };

  const addEmployee = () => {
    if (isReadOnly) {
      addToast('閲覧専用モードでは編集できません', 'warning');
      return;
    }
    
    const newEmployee = {
      id: nextId.current++,
      name: `メンバー${String.fromCharCode(64 + nextId.current)}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      scores: { dataAnalysis: 3, problemSolving: 3, techKnowledge: 3, learnSpeed: 3, creativity: 3, planning: 3, communication: 3, support: 3, management: 3, strategy: 3 },
      isExpanded: false,
      memo: ''
    };
    setEmployees(prev => [...prev, newEmployee]);
    setSelectedEmployees(prev => [...prev, newEmployee.id]);
    setHasUnsavedChanges(true);
    addToast('新しいメンバーを追加しました', 'success');
  };

  const removeEmployee = (id) => {
    if (isReadOnly) {
      addToast('閲覧専用モードでは編集できません', 'warning');
      return;
    }
    
    const employeeToRemove = employees.find(emp => emp.id === id);
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setSelectedEmployees(prev => prev.filter(empId => empId !== id));
    setHasUnsavedChanges(true);
    addToast('メンバーを削除しました', 'info');
  };

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  const handleScoreChange = (empId, competency, value) => {
    if (isReadOnly) return;
    
    setEmployees(prev => prev.map(emp => 
      emp.id === empId ? { ...emp, scores: { ...emp.scores, [competency]: parseInt(value) } } : emp
    ));
    setHasUnsavedChanges(true);
  };

  const handleEmployeeMemoChange = (empId, memo) => {
    if (isReadOnly) return;
    
    setEmployees(prev => prev.map(emp => 
      emp.id === empId ? { ...emp, memo } : emp
    ));
    setHasUnsavedChanges(true);
  };

  const handleIdealChange = (competency, value) => {
    setIdealProfile(prev => ({ ...prev, [competency]: parseInt(value) }));
    setHasUnsavedChanges(true);
  };

  // チャートデータ準備
  const prepareChartData = () => {
    const data = Object.entries(competencyNames).map(([key, name]) => {
      const dataPoint = { competency: name };
      if (showIdeal) dataPoint['理想'] = idealProfile[key];
      employees.filter(emp => selectedEmployees.includes(emp.id)).forEach(emp => {
        dataPoint[emp.name] = emp.scores[key];
      });
      return dataPoint;
    });
    return data;
  };

  const calculateScatterData = () => {
    const data = [];
    if (showIdeal) {
      const idealTechnical = (idealProfile.dataAnalysis + idealProfile.problemSolving + idealProfile.techKnowledge + idealProfile.learnSpeed + idealProfile.creativity) / 5;
      const idealHuman = (idealProfile.planning + idealProfile.communication + idealProfile.support + idealProfile.management + idealProfile.strategy) / 5;
      data.push({ id: 'ideal', name: '理想', technical: parseFloat(idealTechnical.toFixed(1)), human: parseFloat(idealHuman.toFixed(1)), color: '#94a3b8', type: 'ideal' });
    }
    employees.filter(emp => selectedEmployees.includes(emp.id)).forEach(emp => {
      const technical = (emp.scores.dataAnalysis + emp.scores.problemSolving + emp.scores.techKnowledge + emp.scores.learnSpeed + emp.scores.creativity) / 5;
      const human = (emp.scores.planning + emp.scores.communication + emp.scores.support + emp.scores.management + emp.scores.strategy) / 5;
      data.push({ id: emp.id, name: emp.name, technical: parseFloat(technical.toFixed(1)), human: parseFloat(human.toFixed(1)), color: emp.color, type: 'employee' });
    });
    return data;
  };

  // Supabase連携(組織単位)
  const saveToSupabase = async (silent = false) => {
    if (!user || !currentOrganization || isReadOnly) return;
    
    setIsSaving(true);
    try {
      // 更新されたメンバーのリストを作成
      const updatedMembers = employees.map(emp => emp.name);
      
      const { data, error } = await supabase
        .from('evaluations')
        .upsert({ 
          organization_id: currentOrganization.id,
          employees, 
          ideal_profile: idealProfile, 
          team_memo: teamMemo, 
          evaluation_history: evaluationHistory,
          competency_criteria: competencyCriteria,
          competency_names: competencyNames,
          settings: {
            ...settings,
            showCriteria,
            uiState  // UI状態を保存
          },
          updated_at: new Date().toISOString() 
        }, {
          onConflict: 'organization_id'
        });
      
      if (error) throw error;
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      
      // 通知を作成
      if (!silent) {
        await createNotification(
          'evaluation_updated',
          `${user.user_metadata?.full_name || user.email}が評価データを更新しました`,
          {
            memberCount: employees.length,
            updatedMembers: updatedMembers,
            timestamp: new Date().toISOString(),
            changes: {
              memberCount: employees.length,
              updatedMembers: updatedMembers
            }
          }
        );
        addToast('データを保存しました', 'success');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      addToast('保存に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const loadFromSupabase = async () => {
    if (!user || !currentOrganization) return;
    
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        console.log('Loaded evaluation data:', data);
        setEmployees(data.employees || []);
        setIdealProfile(data.ideal_profile || idealProfile);
        setTeamMemo(data.team_memo || '');
        setEvaluationHistory(data.evaluation_history || []);
        if (data.competency_criteria) setCompetencyCriteria(data.competency_criteria);
        if (data.competency_names) setCompetencyNames(data.competency_names);
        if (data.settings) {
          setSettings(data.settings);
          // UI状態の復元
          if (data.settings.uiState) {
            setUiState(data.settings.uiState);
          }
        }
        if (data.settings?.showCriteria !== undefined) {
          setShowCriteria(data.settings.showCriteria);
        }
        setLastSaved(new Date(data.updated_at));
        addToast('データを読み込みました', 'success');
      } else {
        console.log('No evaluation data found for this organization');
        
        if (currentOrganization.role === 'owner') {
          console.log('Creating initial evaluation data as owner');
          const { error: createError } = await supabase
            .from('evaluations')
            .insert({
              organization_id: currentOrganization.id,
              employees: [
                { 
                  id: 1, 
                  name: 'メンバーA', 
                  color: '#3b82f6', 
                  scores: { 
                    dataAnalysis: 3, 
                    problemSolving: 4, 
                    techKnowledge: 3, 
                    learnSpeed: 4, 
                    creativity: 3, 
                    planning: 3, 
                    communication: 4, 
                    support: 3, 
                    management: 2, 
                    strategy: 3 
                  }, 
                  isExpanded: false, 
                  memo: '' 
                }
              ],
              ideal_profile: { 
                dataAnalysis: 5, 
                problemSolving: 5, 
                techKnowledge: 5, 
                learnSpeed: 5, 
                creativity: 5, 
                planning: 5, 
                communication: 5, 
                support: 5, 
                management: 5, 
                strategy: 5, 
                isExpanded: false 
              },
              team_memo: '',
              evaluation_history: [],
              competency_criteria: competencyCriteria,
              competency_names: competencyNames,
              settings: { 
                logoUrl: null, 
                appName: '評価シート', 
                autoSave: true, 
                autoSaveInterval: 1,
                labels: {
                  chartTitle: '📊 能力レーダーチャート',
                  criteriaTitle: '📋 能力評価基準',
                  teamMemoTitle: '📝 チーム全体のメモ',
                  memberManagementTitle: 'メンバー管理',
                  idealProfileTitle: '理想形'
                },
                uiState: {
                  showCriteria: false,
                  showTeamMemo: false,
                  showIdealProfile: false,
                  showMemberList: true,
                }
              }
            });
          
          if (createError) {
            console.error('Failed to create initial evaluation data:', createError);
          } else {
            addToast('初期データを作成しました', 'info');
            setTimeout(() => loadFromSupabase(), 500);
          }
        } else {
          addToast('この組織にはまだデータがありません', 'info');
        }
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
      addToast('データの読み込みに失敗しました', 'error');
    }
  };

  // エクスポート・インポート
  const exportData = () => {
    const dataStr = JSON.stringify({ employees, idealProfile, teamMemo, evaluationHistory, competencyCriteria, competencyNames, settings }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ps-evaluation-${currentOrganization?.name || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addToast('データをエクスポートしました', 'success');
  };

  const importData = (e) => {
    if (isReadOnly) {
      addToast('閲覧専用モードではインポートできません', 'warning');
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setEmployees(data.employees || []);
        setIdealProfile(data.idealProfile || idealProfile);
        setTeamMemo(data.teamMemo || '');
        setEvaluationHistory(data.evaluationHistory || []);
        if (data.competencyCriteria) setCompetencyCriteria(data.competencyCriteria);
        if (data.competencyNames) setCompetencyNames(data.competencyNames);
        if (data.settings) setSettings(data.settings);
        setHasUnsavedChanges(true);
        addToast('データをインポートしました', 'success');
      } catch (error) {
        addToast('データの読み込みに失敗しました', 'error');
      }
    };
    reader.readAsText(file);
  };

  // SVGエクスポート
  const exportChartAsSVG = () => {
    if (!chartRef.current) return;
    
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) return;
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-${currentOrganization?.name || 'data'}-${new Date().toISOString().split('T')[0]}.svg`;
    link.click();
    addToast('チャートをSVGで保存しました', 'success');
  };

  // 履歴保存
  const saveAsHistory = () => {
    if (isReadOnly) {
      addToast('閲覧専用モードでは編集できません', 'warning');
      return;
    }
    
    if (!newEvaluationDate) {
      addToast('評価日を入力してください', 'warning');
      return;
    }
    
    const historyEntry = {
      id: Date.now(),
      date: newEvaluationDate,
      memo: newEvaluationMemo,
      employees: JSON.parse(JSON.stringify(employees)),
      idealProfile: JSON.parse(JSON.stringify(idealProfile))
    };
    
    setEvaluationHistory(prev => [...prev, historyEntry].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setNewEvaluationMemo('');
    addToast('履歴に保存しました', 'success');
    setHasUnsavedChanges(true);
  };

  // 時系列データ準備
  const prepareTimelineData = (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return [];
    
    const timeline = evaluationHistory
      .filter(h => h.employees.find(e => e.id === empId))
      .map(h => {
        const historicalEmp = h.employees.find(e => e.id === empId);
        return {
          date: h.date,
          average: calculateAverage(historicalEmp.scores),
          ...historicalEmp.scores
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    timeline.push({
      date: '現在',
      average: calculateAverage(emp.scores),
      ...emp.scores
    });
    
    return timeline;
  };

  // チーム分析
  const calculateTeamStats = () => {
    const stats = {};
    Object.keys(competencyNames).forEach(key => {
      const scores = employees.map(emp => emp.scores[key]);
      stats[key] = {
        name: competencyNames[key],
        average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        max: Math.max(...scores),
        min: Math.min(...scores)
      };
    });
    return stats;
  };

  // 設定保存ハンドラー
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    addToast('設定を保存しました', 'success');
  };

  // 評価基準保存ハンドラー
  const handleSaveCriteria = (newCriteria) => {
    if (isReadOnly) {
      addToast('閲覧専用モードでは編集できません', 'warning');
      return;
    }
    
    setCompetencyCriteria(newCriteria);
    
    const updatedNames = {};
    Object.entries(newCriteria).forEach(([key, value]) => {
      updatedNames[key] = value.name;
    });
    setCompetencyNames(updatedNames);
    
    setHasUnsavedChanges(true);
    
    // 評価基準更新の通知を作成
    createNotification(
      'criteria_updated',
      `${user.user_metadata?.full_name || user.email}が評価基準を更新しました`,
      { criteriaCount: Object.keys(newCriteria).length }
    );
    
    addToast('評価基準を更新しました', 'success');
    
    setTimeout(() => {
      saveToSupabase(false);
    }, 100);
  };

  // 認証処理
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      addToast('ログインしました', 'success');
    } catch (error) {
      addToast('ログインに失敗しました', 'error');
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setCurrentOrganization(null);
      setOrganizations([]);
      addToast('ログアウトしました', 'info');
    } catch (error) {
      addToast('ログアウトに失敗しました', 'error');
      console.error('Sign out error:', error);
    }
  };

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const handleDragEnd = (event) => {
    if (isReadOnly) return;
    
    const { active, over } = event;
    if (active.id !== over.id) {
      setEmployees((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasUnsavedChanges(true);
    }
  };

// 招待URLの処理
useEffect(() => {
  const path = window.location.pathname;
  const match = path.match(/\/invite\/(.+)/);
  
  if (match && user) {
    const token = match[1];
    console.log('Processing invitation token:', token);
    
    acceptInvitation(token, user.id)
      .then(async (invitation) => {
        console.log('Invitation processed:', invitation);
        
        // 組織リストを再読み込み
        const orgs = await getUserOrganizations(user.id);
        console.log('Organizations after join:', orgs);
        setOrganizations(orgs);
        
        // 対象の組織を見つける
        const joinedOrg = orgs.find(org => org.id === invitation.organization_id);
        console.log('Target organization:', joinedOrg);
        
        if (joinedOrg) {
          // 組織を切り替え
          setCurrentOrganization(joinedOrg);
          
          // メッセージを表示
          if (invitation.isExistingMember) {
            addToast(`${joinedOrg.name}に切り替えました（既にメンバーです）`, 'info');
          } else {
            addToast(`${joinedOrg.name}に参加しました`, 'success');
          }
          
          // データを読み込み
          setTimeout(() => {
            loadFromSupabase();
            loadOrganizationMembers();
            loadNotifications();
          }, 500);
        } else {
          console.error('Organization not found in user organizations');
          addToast('組織への参加に成功しましたが、組織情報の読み込みに失敗しました', 'warning');
          
          // 組織リストを再度読み込む
          setTimeout(() => {
            loadUserOrganizations();
          }, 1000);
        }
        
        // URLをクリーンアップ
        window.history.pushState({}, '', '/');
      })
      .catch(error => {
        console.error('Invitation acceptance failed:', error);
        
        let errorMessage = '招待の承認に失敗しました';
        if (error.message) {
          errorMessage = error.message;
        }
        
        addToast(errorMessage, 'error');
        window.history.pushState({}, '', '/');
      });
  }
}, [user]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isReadOnly) saveToSupabase(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportData();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        if (!isReadOnly) addEmployee();
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') setViewMode('current');
        if (e.key === '2') setViewMode('history');
        if (e.key === '3') setViewMode('compare');
        if (e.key === '4') setViewMode('comparison');
        if (e.key === '5') setViewMode('dashboard');
      }
      if (e.key === '?') {
        setShowKeyboardHelp(true);
      }
      if (e.key === 'Escape') {
        setShowKeyboardHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReadOnly]);

  // オンライン状態監視
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 認証状態の確認
  useEffect(() => {
    getCurrentUser().then(setUser).finally(() => setAuthLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ユーザーの組織を読み込み
  useEffect(() => {
    if (user) {
      loadUserOrganizations();
    }
  }, [user]);

  // 組織が選択されたらデータとメンバーを読み込み
  useEffect(() => {
    if (currentOrganization) {
      loadFromSupabase();
      loadOrganizationMembers();
      loadNotifications();
    }
  }, [currentOrganization]);

  // 定期保存
  useEffect(() => {
    if (!settings.autoSave || isReadOnly) return;
    
    const interval = setInterval(() => {
      if (hasUnsavedChanges && isOnline && user && currentOrganization) {
        saveToSupabase(true);
      }
    }, settings.autoSaveInterval * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, isOnline, user, currentOrganization, settings.autoSave, settings.autoSaveInterval, isReadOnly]);

  const teamStats = useMemo(() => calculateTeamStats(), [employees]);
  const topStrengths = useMemo(() => 
    Object.entries(teamStats).sort((a, b) => parseFloat(b[1].average) - parseFloat(a[1].average)).slice(0, 3),
    [teamStats]
  );
  const bottomWeaknesses = useMemo(() => 
    Object.entries(teamStats).sort((a, b) => parseFloat(a[1].average) - parseFloat(b[1].average)).slice(0, 3),
    [teamStats]
  );

  const filteredEmployees = useMemo(() => filterEmployeesBySearch(employees), [employees, searchQuery]);

  // ローディング中
  if (authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  // 未ログイン
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginScreen onSignIn={handleSignIn} />
      </ThemeProvider>
    );
  }

  // 組織未選択
  if (!currentOrganization && !showCreateOrg) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <OrganizationSelectorModal
          open={organizations.length === 0 || showOrgSelector}
          onClose={() => {
            if (organizations.length > 0) {
              setShowOrgSelector(false);
            }
          }}
          organizations={organizations}
          onSelect={handleSelectOrganization}
          onCreateNew={() => {
            setShowOrgSelector(false);
            setShowCreateOrg(true);
          }}
        />
        <CreateOrganizationModal
          open={showCreateOrg}
          onClose={() => {
            if (organizations.length > 0) {
              setShowCreateOrg(false);
            }
          }}
          onCreate={handleCreateOrganization}
        />
      </ThemeProvider>
    );
  }
  
  // 組織作成中の表示を追加
  if (showCreateOrg && !currentOrganization) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CreateOrganizationModal
          open={showCreateOrg}
          onClose={() => {
            if (organizations.length > 0) {
              setShowCreateOrg(false);
            }
          }}
          onCreate={handleCreateOrganization}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* トースト通知 */}
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          open={true}
          message={toast.message}
          severity={toast.severity}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* キーボードショートカットモーダル */}
      <KeyboardShortcutsModal 
        isOpen={showKeyboardHelp} 
        onClose={() => setShowKeyboardHelp(false)} 
      />

      {/* 評価基準カスタマイズモーダル */}
      <CriteriaSettingsModal
        open={showCriteriaSettings}
        onClose={() => setShowCriteriaSettings(false)}
        criteria={competencyCriteria}
        onSave={handleSaveCriteria}
      />

      {/* 設定モーダル */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* 組織選択モーダル */}
      <OrganizationSelectorModal
        open={showOrgSelector}
        onClose={() => setShowOrgSelector(false)}
        organizations={organizations}
        onSelect={handleSelectOrganization}
        onCreateNew={() => {
          setShowOrgSelector(false);
          setShowCreateOrg(true);
        }}
      />

      {/* 組織作成モーダル */}
      <CreateOrganizationModal
        open={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        onCreate={handleCreateOrganization}
      />

      {/* チームメンバー管理モーダル */}
      <TeamMembersModal
        open={showTeamMembers}
        onClose={() => setShowTeamMembers(false)}
        organization={currentOrganization}
        members={organizationMembers}
        onInvite={handleInviteMember}
        onRemove={handleRemoveMember}
        currentUserId={user.id}
      />

      {/* 通知モーダル */}
      <NotificationsModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
      />

      {/* メインレイアウト */}
      <MainLayout 
        viewMode={viewMode} 
        setViewMode={setViewMode}
        user={user}
        onSignOut={handleSignOut}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        settings={settings}
        onOpenSettings={() => setShowSettings(true)}
        currentOrganization={currentOrganization}
        onOpenTeamMembers={() => setShowTeamMembers(true)}
        onSwitchOrganization={() => setShowOrgSelector(true)}
        organizationMembers={organizationMembers}
        onDeleteOrganization={handleDeleteOrganization}
        notifications={notifications}
        unreadCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
      >
        <Container maxWidth="xl" disableGutters>
          {/* 閲覧専用警告 */}
          {isReadOnly && (
            <Alert severity="info" sx={{ mb: 2 }}>
              閲覧専用モードです。データの編集はできません。
            </Alert>
          )}

          {/* アクションバー */}
          <ActionBar
  isSaving={isSaving}
  isOnline={isOnline}
  hasUnsavedChanges={hasUnsavedChanges}
  lastSaved={lastSaved}
  onSave={() => saveToSupabase(false)}
  onExportSVG={exportChartAsSVG}
  onExportJSON={exportData}
  onImport={importData}
  onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
  onAddMember={addEmployee}
  showIdeal={showIdeal}
  onToggleIdeal={() => setShowIdeal(!showIdeal)}
  chartType={chartType}
  onChartTypeChange={setChartType}
  isReadOnly={isReadOnly}
  settings={settings}
  onOpenSettings={() => setShowSettings(true)}
  onSaveHistory={saveAsHistory}
  evaluationDate={newEvaluationDate}
  onEvaluationDateChange={setNewEvaluationDate}
  evaluationMemo={newEvaluationMemo}
  onEvaluationMemoChange={setNewEvaluationMemo}
/>

          {/* プログレスインジケーター */}
          {isSaving && (
            <LinearProgress sx={{ mb: 2 }} />
          )}

          {/* 現在の評価ビュー */}
          {viewMode === 'current' && (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, minHeight: { md: 'calc(100vh - 140px)' } }}>
              {/* 左側: チャートエリア */}
              <Box sx={{ flex: { md: '0 0 60%' }, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'auto', pr: { md: 0.5 } }}>



                {/* チャート */}
                <Card ref={chartRef} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ fontWeight: 600, mb: 3, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                      onClick={() => setShowSettings(true)}
                    >
                      {settings.labels?.chartTitle || '📊 能力レーダーチャート'}
                    </Typography>
                    
                    <Box sx={{ width: '100%', height: 500 }}>
                      {chartType === 'radar' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={prepareChartData()}>
                            <PolarGrid stroke="#e2e8f0" strokeWidth={1.5} />
                            <PolarAngleAxis 
                              dataKey="competency" 
                              tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} 
                            />
                            <PolarRadiusAxis 
                              angle={90} 
                              domain={[0, 5]} 
                              tick={{ fill: '#64748b', fontSize: 11 }} 
                              tickCount={6}
                              stroke="#cbd5e1"
                            />
                            {showIdeal && (
                              <Radar 
                                name="理想" 
                                dataKey="理想" 
                                stroke="#94a3b8" 
                                fill="#94a3b8" 
                                fillOpacity={0.15} 
                                strokeWidth={3} 
                                strokeDasharray="8 4" 
                              />
                            )}
                            {employees.filter(emp => selectedEmployees.includes(emp.id)).map(emp => (
                              <Radar 
                                key={emp.id} 
                                name={emp.name} 
                                dataKey={emp.name} 
                                stroke={emp.color} 
                                fill={emp.color} 
                                fillOpacity={0.25} 
                                strokeWidth={3} 
                              />
                            ))}
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="circle"
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              type="number" 
                              dataKey="technical" 
                              name="テクニカルスキル" 
                              domain={[0, 5.5]} 
                              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                              label={{ value: 'テクニカルスキル', position: 'bottom', offset: 10, style: { fill: '#475569', fontWeight: 600 } }}
                            />
                            <YAxis 
                              type="number" 
                              dataKey="human" 
                              name="ヒューマンスキル" 
                              domain={[0, 5.5]} 
                              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                              label={{ value: 'ヒューマンスキル', angle: -90, position: 'left', offset: 20, style: { fill: '#475569', fontWeight: 600 } }}
                            />
                            <ZAxis range={[400, 400]} />
                            <Tooltip 
                              cursor={{ strokeDasharray: '3 3' }}
                              content={({ payload }) => {
                                if (payload && payload.length > 0) {
                                  const data = payload[0].payload;
                                  return (
                                    <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                        {data.name}
                                      </Typography>
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        テクニカル: <strong>{data.technical}</strong>
                                      </Typography>
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        ヒューマン: <strong>{data.human}</strong>
                                      </Typography>
                                    </Paper>
                                  );
                                }
                                return null;
                              }} 
                            />
                            <Scatter data={calculateScatterData()}>
                              {calculateScatterData().map((entry) => (
                                <Cell 
                                  key={`cell-${entry.id}`} 
                                  fill={entry.type === 'ideal' ? 'transparent' : entry.color} 
                                  stroke={entry.color}
                                  strokeWidth={entry.type === 'ideal' ? 3 : 0}
                                  strokeDasharray={entry.type === 'ideal' ? '8 4' : '0'}
                                  r={14}
                                />
                              ))}
                            </Scatter>
                            <Legend 
                              content={() => (
                                <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                                  {calculateScatterData().map((entry) => (
                                    <Chip
                                      key={entry.id}
                                      label={entry.name}
                                      size="small"
                                      sx={{
                                        bgcolor: `${entry.color}25`,
                                        borderColor: entry.color,
                                        borderWidth: 2,
                                        borderStyle: entry.type === 'ideal' ? 'dashed' : 'solid',
                                        fontWeight: 600,
                                      }}
                                    />
                                  ))}
                                </Box>
                              )} 
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* チームメモ - 折りたたみ可能 */}
                <Accordion
                  expanded={uiState.showTeamMemo}
                  onChange={() => {
                    const newState = !uiState.showTeamMemo;
                    setUiState(prev => ({ ...prev, showTeamMemo: newState }));
                    setHasUnsavedChanges(true);
                  }}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography 
                      variant="h6" 
                      sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSettings(true);
                      }}
                    >
                      {settings.labels?.teamMemoTitle || '📝 チーム全体のメモ'}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      placeholder="今期の評価方針、全体的な傾向、次回の見直しポイントなど..."
                      value={teamMemo}
                      onChange={(e) => {
                        if (!isReadOnly) {
                          setTeamMemo(e.target.value);
                          setHasUnsavedChanges(true);
                        }
                      }}
                      disabled={isReadOnly}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.9rem',
                          lineHeight: 1.7,
                        }
                      }}
                    />
                  </AccordionDetails>
                </Accordion>
              </Box>

              {/* 右側: メンバーカード(スクロール可能) */}
              <Box sx={{ flex: { md: '0 0 40%' }, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'auto', pl: { md: 0.5 } }}>
                {/* ヘッダー */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography 
                        variant="h6" 
                        sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => setShowSettings(true)}
                      >
                        {settings.labels?.memberManagementTitle || 'メンバー管理'}
                      </Typography>
                      <Chip 
                        label={`${filteredEmployees.length}名`} 
                        size="small"
                        sx={{ 
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                        }}
                      />
                    </Stack>
                  </Stack>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={(selectedEmployees.length / employees.length) * 100} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 1,
                      bgcolor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      }
                    }}
                  />
                </Paper>

                {/* 能力評価基準(折りたたみ式) */}
                <Accordion 
                  expanded={uiState.showCriteria}
                  onChange={() => {
                    const newState = !uiState.showCriteria;
                    setUiState(prev => ({ ...prev, showCriteria: newState }));
                    setHasUnsavedChanges(true);
                  }}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={600} 
                        sx={{ flex: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSettings(true);
                        }}
                      >
                        {settings.labels?.criteriaTitle || '📋 能力評価基準'}
                      </Typography>
                      {!isReadOnly && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCriteriaSettings(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.5}>
                      {Object.entries(competencyCriteria).map(([key, competency]) => (
                        <Accordion
                          key={key}
                          elevation={0}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px !important',
                            '&:before': { display: 'none' },
                          }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" fontWeight={600}>
                              {competency.name}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={1}>
                              {Object.entries(competency.levels).map(([level, description]) => (
                                <Box key={level} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                  <Chip 
                                    label={`${level}`} 
                                    size="small" 
                                    sx={{ 
                                      minWidth: 32,
                                      height: 24,
                                      fontWeight: 700,
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      color: 'white',
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ pt: 0.25, lineHeight: 1.6, flex: 1 }}>
                                    {description}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* 理想形カード - 折りたたみ可能 */}
                {showIdeal && (
                  <Accordion
                    expanded={uiState.showIdealProfile}
                    onChange={() => {
                      const newState = !uiState.showIdealProfile;
                      setUiState(prev => ({ ...prev, showIdealProfile: newState }));
                      setHasUnsavedChanges(true);
                    }}
                    elevation={0}
                    sx={{ 
                      border: '2px dashed',
                      borderColor: '#cbd5e1',
                      bgcolor: '#f8fafc',
                      borderRadius: '12px !important',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={600} 
                          sx={{ flex: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(true);
                          }}
                        >
                          {settings.labels?.idealProfileTitle || '理想形'}
                        </Typography>
                        <Chip 
                          label={calculateAverage(idealProfile)} 
                          size="small" 
                          sx={{ fontWeight: 700, bgcolor: '#e2e8f0' }}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1.5}>
                        {Object.entries(competencyNames).map(([key, name]) => (
                          <Grid item xs={6} key={key}>
                            <FormControl fullWidth size="small" disabled={isReadOnly}>
                              <InputLabel>{name}</InputLabel>
                              <Select
                                value={idealProfile[key]}
                                label={name}
                                onChange={(e) => !isReadOnly && handleIdealChange(key, e.target.value)}
                              >
                                {[1, 2, 3, 4, 5].map(level => (
                                  <MenuItem key={level} value={level}>Lv.{level}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* 検索結果の表示 */}
                {searchQuery && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    「{searchQuery}」で{filteredEmployees.length}件見つかりました
                  </Alert>
                )}

                {/* メンバーカード */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredEmployees.map(emp => emp.id)} strategy={verticalListSortingStrategy}>
                    {filteredEmployees.map(emp => (
                      <SortableEmployeeCard
                        key={emp.id}
                        emp={emp}
                        competencyNames={competencyNames}
                        selectedEmployees={selectedEmployees}
                        toggleEmployee={toggleEmployee}
                        removeEmployee={removeEmployee}
                        handleScoreChange={handleScoreChange}
                        handleEmployeeMemoChange={handleEmployeeMemoChange}
                        calculateAverage={calculateAverage}
                        getStrengthsAndWeaknesses={getStrengthsAndWeaknesses}
                        setEmployees={setEmployees}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </Box>
            </Box>
          )}

          {/* 成長履歴ビュー */}
          {viewMode === 'history' && (
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  📊 成長履歴
                </Typography>
                {evaluationHistory.length === 0 ? (
                  <Alert severity="info">
                    履歴がありません。「現在の評価」タブから履歴を保存してください。
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {evaluationHistory.map(history => (
                      <Grid item xs={12} md={6} key={history.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                              <Typography variant="h6">
                                {new Date(history.date).toLocaleDateString('ja-JP')}
                              </Typography>
                              {!isReadOnly && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    if (window.confirm('この履歴を削除しますか?')) {
                                      setEvaluationHistory(prev => prev.filter(h => h.id !== history.id));
                                      setHasUnsavedChanges(true);
                                      addToast('履歴を削除しました', 'info');
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Stack>
                            {history.memo && (
                              <Chip label={history.memo} size="small" sx={{ mb: 2 }} />
                            )}
                            <Typography variant="body2" color="text.secondary">
                              {history.employees.length}人のメンバー
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          )}

          {/* 時系列比較ビュー */}
          {viewMode === 'comparison' && (
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  📈 成長トレンド分析
                </Typography>
                {evaluationHistory.length === 0 ? (
                  <Alert severity="info">
                    履歴が2件以上必要です。「現在の評価」タブから履歴を保存してください。
                  </Alert>
                ) : (
                  <Stack spacing={4}>
                    {employees.map(emp => {
                      const timeline = prepareTimelineData(emp.id);
                      if (timeline.length === 0) return null;

                      return (
                        <Card key={emp.id} variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: emp.color }} />
                              {emp.name}の成長推移
                            </Typography>

                            <Box sx={{ width: '100%', height: 300 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeline}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                  <YAxis domain={[0, 5]} />
                                  <RechartsTooltip />
                                  <Legend />
                                  <Line 
                                    type="monotone" 
                                    dataKey="average" 
                                    stroke={emp.color} 
                                    strokeWidth={3}
                                    name="平均スコア"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </Box>

                            {timeline.length > 1 && (
                              <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={4}>
                                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      初回評価
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                      {timeline[0].average}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={4}>
                                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      現在
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                      {timeline[timeline.length - 1].average}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={4}>
                                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                                    <Typography variant="caption" color="success.main">
                                      成長率
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} color="success.main">
                                      +{(parseFloat(timeline[timeline.length - 1].average) - parseFloat(timeline[0].average)).toFixed(1)}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              </Grid>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

          {/* チーム分析ダッシュボード */}
          {viewMode === 'dashboard' && (
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" gutterBottom>
                    📊 チーム全体の分析
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
                        <Typography variant="caption">チーム平均スコア</Typography>
                        <Typography variant="h3" fontWeight={700}>
                          {(() => {
                            const allAverages = employees.map(emp => parseFloat(calculateAverage(emp.scores)));
                            return (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1);
                          })()}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: 3 }}>
                        <Typography variant="caption">最高スコア保持者</Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {(() => {
                            const sorted = [...employees].sort((a, b) => 
                              parseFloat(calculateAverage(b.scores)) - parseFloat(calculateAverage(a.scores))
                            );
                            return sorted[0].name;
                          })()}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: 3 }}>
                        <Typography variant="caption">評価実施回数</Typography>
                        <Typography variant="h3" fontWeight={700}>
                          {evaluationHistory.length + 1}回
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: 'success.50' }}>
                        <Typography variant="h6" color="success.dark" gutterBottom>
                          💪 チームの強み TOP3
                        </Typography>
                        <Stack spacing={2}>
                          {topStrengths.map(([key, stat], index) => (
                            <Paper key={key} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {index + 1}. {stat.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  最高: Lv.{stat.max} / 最低: Lv.{stat.min}
                                </Typography>
                              </Box>
                              <Typography variant="h5" fontWeight={700} color="success.main">
                                {stat.average}
                              </Typography>
                            </Paper>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: 'warning.50' }}>
                        <Typography variant="h6" color="warning.dark" gutterBottom>
                          📌 強化すべき領域 TOP3
                        </Typography>
                        <Stack spacing={2}>
                          {bottomWeaknesses.map(([key, stat], index) => (
                            <Paper key={key} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {index + 1}. {stat.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  最高: Lv.{stat.max} / 最低: Lv.{stat.min}
                                </Typography>
                              </Box>
                              <Typography variant="h5" fontWeight={700} color="warning.main">
                                {stat.average}
                              </Typography>
                            </Paper>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Container>
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;