'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BirthdayInfo } from '@/types';
import { getUpcomingBirthdays } from '@/lib/birthday-utils';
import { peopleService, userService } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Cake, Calendar, User, Settings, LogOut, Crown, Eye, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { currentUser, isAdmin, isVisitor, logout } = useAuth();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayInfo[]>([]);
  const [mounted, setMounted] = useState(false);
  const [totalPeople, setTotalPeople] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Check admin and load data
    const init = async () => {
      const hasAdmin = await userService.hasAdmin();
      if (!hasAdmin) {
        router.push('/login');
        return;
      }
      // Load total people count
      const allPeople = await peopleService.getAll();
      setTotalPeople(allPeople.length);
      // Load birthdays if user is logged in
      if (currentUser) {
        await loadBirthdays();
      }
    };
    init();
  }, [currentUser, router]);

  const loadBirthdays = async () => {
    const people = await peopleService.getVisiblePeople(currentUser?.id, isAdmin);
    const upcoming = getUpcomingBirthdays(people, 90);
    setUpcomingBirthdays(upcoming);
  };

  if (!mounted) {
    return null;
  }

  const getAvatarInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const getAgeText = (info: BirthdayInfo) => {
    if (info.age === -1) return null;
    return `${info.age}岁`;
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Cake className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">生日提醒</h1>
              <p className="text-sm text-gray-500">亲友生日管理系统</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                <div className="flex items-center gap-2 mr-2">
                  {isAdmin ? (
                    <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500">
                      <Crown className="w-3 h-3 mr-1" />
                      管理员
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                      <Eye className="w-3 h-3 mr-1" />
                      访客
                    </Badge>
                  )}
                  <span className="text-sm text-gray-600">{currentUser.username}</span>
                </div>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      管理面板
                    </Button>
                  </Link>
                )}
                {!isAdmin && (
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      <Crown className="w-4 h-4 mr-2" />
                      管理员登录
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    退出
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentUser ? `欢迎, ${currentUser.username}!` : '生日提醒系统'}
          </h2>
          <p className="text-gray-600">
            查看未来 3 个月内即将过生日的好友和家人
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-gradient-pink">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">即将过生日</CardTitle>
              <Cake className="w-4 h-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{upcomingBirthdays.length}</div>
              <p className="text-xs text-gray-500">未来 90 天内</p>
            </CardContent>
          </Card>

          <Card className="border-gradient-purple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">今天生日</CardTitle>
              <Calendar className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {upcomingBirthdays.filter(b => b.isToday).length}
              </div>
              <p className="text-xs text-gray-500">祝他们生日快乐!</p>
            </CardContent>
          </Card>

          <Card className="border-gradient-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总人数</CardTitle>
              <User className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalPeople}</div>
              <p className="text-xs text-gray-500">已记录的亲友</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">即将到来的生日</CardTitle>
            <CardDescription>
              显示未来 3 个月内即将过生日的人员
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Cake className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">暂无即将到来的生日</p>
                {isAdmin && (
                  <Link href="/admin">
                    <Button className="mt-4" variant="outline">
                      添加新成员
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBirthdays.map((info, index) => (
                  <div
                    key={info.person.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
                      info.isToday
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-pink-200'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback
                          className={`${
                            info.person.category === 'family'
                              ? 'bg-gradient-to-br from-pink-500 to-rose-500'
                              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          } text-white text-lg`}
                        >
                          {getAvatarInitials(info.person.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{info.person.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {info.person.category === 'family' ? '家人' : '朋友'}
                          </Badge>
                          {info.person.isLunar && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                              农历
                            </Badge>
                          )}
                          {info.isToday && (
                            <Badge variant="default" className="text-xs bg-gradient-to-r from-pink-500 to-purple-500">
                              今天
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {getAgeText(info) && <span className="mr-3">{getAgeText(info)}</span>}
                          <span>
                            {info.person.isLunar ? '农历' : '公历'}{' '}
                            {info.nextBirthdayDate.toLocaleDateString('zh-CN', {
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${
                          info.isToday
                            ? 'text-pink-600'
                            : info.daysUntilBirthday <= 7
                            ? 'text-orange-500'
                            : 'text-gray-700'
                        }`}
                      >
                        {info.isToday ? '今天!' : info.daysUntilBirthday === 0 ? '今天!' : `${info.daysUntilBirthday}天后`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {info.nextBirthdayDate.getFullYear()}年
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-12 py-6 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>生日提醒系统 - 让关怀不缺席</p>
        </div>
      </footer>
    </div>
  );
}
