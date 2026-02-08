'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Cake, Crown, UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasAdmin, setHasAdmin] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const adminExists = await userService.hasAdmin();
      setHasAdmin(adminExists);
      setIsInitializing(!adminExists);
    };
    checkAdmin();
    // Redirect if already logged in as admin
    if (isAdmin) {
      const from = searchParams.get('from') || '/';
      router.push(from);
    }
  }, [isAdmin, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast.error('请输入用户名');
      return;
    }

    if (isInitializing) {
      if (!password) {
        toast.error('请设置密码');
        return;
      }
      await userService.create({
        username,
        password,
        role: 'admin',
      });
      toast.success('管理员账户创建成功');
      await login(username, password);
      router.push('/');
      return;
    }

    const success = await login(username, password);
    if (success) {
      toast.success(`欢迎回来, ${username}!`);
      const from = searchParams.get('from') || '/';
      router.push(from);
    } else {
      toast.error('用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            {isInitializing ? <UserPlus className="w-8 h-8 text-white" /> : <Crown className="w-8 h-8 text-white" />}
          </div>
          <CardTitle className="text-2xl">
            {isInitializing ? '初始化管理员' : '管理员登录'}
          </CardTitle>
          <CardDescription>
            {isInitializing ? '首次使用请设置管理员用户名和密码' : '请输入管理员凭据以获得管理权限'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isInitializing ? '请设置密码' : '请输入密码'}
              />
            </div>
            
            <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-600">
              {isInitializing ? '完成设置' : '登录'}
            </Button>
            
            {!isInitializing && (
              <Link href="/">
                <Button type="button" variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
