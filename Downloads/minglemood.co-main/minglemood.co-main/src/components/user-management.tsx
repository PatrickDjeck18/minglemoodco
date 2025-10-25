import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface UserManagementProps {
  user: any;
}

interface UserAccount {
  id: string;
  email: string;
  created_at: string;
  profile_complete: boolean;
  user_metadata?: any;
}

export function UserManagement({ user }: UserManagementProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailToDelete, setEmailToDelete] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
      console.log('✅ Loaded users:', data.length);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (email: string) => {
    if (!confirm(`Are you sure you want to permanently delete the account for ${email}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(email);
      setMessage(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      console.log('🗑️ Deleting user:', email);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/admin/users/${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Delete failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ User deleted:', result);

      setMessage({ 
        type: 'success', 
        text: `Successfully deleted account for ${email}. You can now use this email to sign up again.` 
      });

      // Reload users list
      await loadUsers();
      setEmailToDelete('');
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="h-5 w-5" />
            Delete User Account (Testing Tool)
          </CardTitle>
          <CardDescription className="text-orange-800">
            Delete user accounts from Supabase Auth so you can re-use the email address for testing signup flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.type === 'success' ? '✅ ' : '❌ '}
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="emailToDelete">Email Address to Delete</Label>
            <div className="flex gap-2">
              <Input
                id="emailToDelete"
                type="email"
                placeholder="user@example.com"
                value={emailToDelete}
                onChange={(e) => setEmailToDelete(e.target.value)}
                disabled={deleting !== null}
              />
              <Button
                onClick={() => deleteUser(emailToDelete)}
                disabled={!emailToDelete || deleting !== null}
                variant="destructive"
                className="min-w-[100px]"
              >
                {deleting === emailToDelete ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-orange-700">
              ⚠️ This permanently deletes the user from Supabase Auth. Use this to re-test signup flows with the same email.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All User Accounts ({users.length})</CardTitle>
            <Button 
              onClick={loadUsers} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((userAccount) => (
                <div
                  key={userAccount.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{userAccount.email}</p>
                      <Badge 
                        variant={userAccount.profile_complete ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {userAccount.profile_complete ? '✅ Complete' : '⏳ Incomplete'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Joined: {new Date(userAccount.created_at).toLocaleDateString()} at {new Date(userAccount.created_at).toLocaleTimeString()}
                    </p>
                    {userAccount.user_metadata?.profile_data?.name && (
                      <p className="text-sm text-gray-600">
                        Name: {userAccount.user_metadata.profile_data.name}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => deleteUser(userAccount.email)}
                    disabled={deleting !== null}
                    variant="destructive"
                    size="sm"
                  >
                    {deleting === userAccount.email ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          <strong>💡 Testing Tip:</strong> After deleting a user, you can immediately sign up again with the same email address to test the complete signup flow. All profile data and preferences will be cleared.
        </AlertDescription>
      </Alert>
    </div>
  );
}
