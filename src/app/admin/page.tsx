'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Person, Gender, Category, LifeStats } from '@/types';
import { peopleService } from '@/lib/storage';
import { getLifeStats, formatDetailedAge } from '@/lib/birthday-utils';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ArrowLeft, Calendar, Clock, Heart, Users, Sparkles, Crown, Lock } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: Gender;
  category: Category;
}

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, isAdmin } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lifeStats, setLifeStats] = useState<LifeStats | null>(null);

  const handleDateChange = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const newDate = new Date(year, month - 1, day, 12, 0, 0);
    setSelectedDate(newDate);
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [formData, setFormData] = useState<FormData>({
    name: '',
    birthDate: '',
    birthTime: '',
    isLunar: false,
    gender: 'male',
    category: 'friend',
  });

  useEffect(() => {
    setMounted(true);
    if (isAdmin) {
      loadPeople();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedPersonId) {
      const person = people.find(p => p.id === selectedPersonId);
      if (person) {
        const stats = getLifeStats(person, selectedDate);
        setLifeStats(stats);
      }
    } else {
      setLifeStats(null);
    }
  }, [selectedPersonId, selectedDate, people]);

  const loadPeople = async () => {
    const allPeople = await peopleService.getAll();
    setPeople(allPeople);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      if (editingPerson) {
        await peopleService.update(editingPerson.id, {
          ...formData,
          birthTime: formData.birthTime || undefined,
        });
        toast.success('更新成功');
      } else {
        await peopleService.create({
          ...formData,
          birthTime: formData.birthTime || undefined,
          visibleTo: [currentUser?.id || 'all'],
        });
        toast.success('添加成功');
      }
      await loadPeople();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      birthDate: person.birthDate.split('T')[0],
      birthTime: person.birthTime || '',
      isLunar: person.isLunar,
      gender: person.gender,
      category: person.category,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除吗？')) {
      await peopleService.delete(id);
      await loadPeople();
      toast.success('删除成功');
      if (selectedPersonId === id) {
        setSelectedPersonId(null);
        setLifeStats(null);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      birthDate: '',
      birthTime: '',
      isLunar: false,
      gender: 'male',
      category: 'friend',
    });
    setEditingPerson(null);
  };

  if (!mounted) {
    return null;
  }

  // 非管理员显示登录提示
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">需要管理员权限</CardTitle>
            <CardDescription>
              此功能需要管理员身份才能访问
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/login?from=${encodeURIComponent('/admin')}`}>
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600">
                <Crown className="w-4 h-4 mr-2" />
                管理员登录
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAvatarInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">管理面板</h1>
              <p className="text-sm text-gray-500">管理亲友信息</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-gradient-to-r from-pink-500 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            添加成员
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="members">成员列表</TabsTrigger>
            <TabsTrigger value="stats">详细统计</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {people.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">暂无成员</p>
                  <p className="text-sm">点击上方"添加成员"开始</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {people.map(person => (
                  <Card key={person.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-14 h-14">
                            <AvatarFallback
                              className={`${
                                person.category === 'family'
                                  ? 'bg-gradient-to-br from-pink-500 to-rose-500'
                                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                              } text-white text-lg`}
                            >
                              {getAvatarInitials(person.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 text-lg">{person.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {person.category === 'family' ? '家人' : '朋友'}
                              </Badge>
                              {person.isLunar && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                  农历
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {person.gender === 'male' ? '♂' : '♀'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              <span>生日: {new Date(person.birthDate).toLocaleDateString('zh-CN')}</span>
                              {person.birthTime && <span className="ml-2">{person.birthTime}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(person)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(person.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  生命统计
                </CardTitle>
                <CardDescription>
                  选择一个人员并指定日期查看详细的生命统计数据
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>选择人员</Label>
                    <Select value={selectedPersonId || ''} onValueChange={setSelectedPersonId}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择一个人员" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>参考日期</Label>
                    <Input
                      type="date"
                      value={formatDateForInput(selectedDate)}
                      onChange={(e) => handleDateChange(e.target.value)}
                    />
                  </div>
                </div>

                {lifeStats && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4" />
                            下一次生日
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-gray-900">
                            {lifeStats.ageAtNextBirthday}岁
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {lifeStats.nextBirthdayDate.toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-lg font-semibold text-purple-600 mt-2">
                            还有 {lifeStats.daysUntilNextBirthday} 天
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                            <Heart className="w-4 h-4" />
                            生命总天数
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-gray-900">
                            {lifeStats.totalDaysLived.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">天</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4" />
                          详细年龄
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold text-gray-900">
                          {formatDetailedAge(lifeStats.detailedAge)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!lifeStats && selectedPersonId && (
                  <div className="text-center py-8 text-gray-500">
                    <p>请选择参考日期查看统计数据</p>
                  </div>
                )}

                {!selectedPersonId && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>请先选择一个人员</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPerson ? '编辑成员' : '添加新成员'}</DialogTitle>
            <DialogDescription>
              填写成员的生日信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <Label htmlFor="category">类别 *</Label>
                <Select value={formData.category} onValueChange={(v: Category) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">家人</SelectItem>
                    <SelectItem value="friend">朋友</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="gender">性别 *</Label>
                <Select value={formData.gender} onValueChange={(v: Gender) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="birthDate">生日日期 *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="birthTime">生日时间 (可选)</Label>
                <Input
                  id="birthTime"
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isLunar"
                  checked={formData.isLunar}
                  onChange={(e) => setFormData({ ...formData, isLunar: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isLunar">农历生日</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600">
                {editingPerson ? '更新' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
