import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button,
  Input,
  Label,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from '@shared/components'
import { useToast } from '@shared/components/toaster'
import { UserPlus, Trash2, Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const userSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi').max(50, 'Username maksimal 50 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter').max(100, 'Password maksimal 100 karakter'),
  full_name: z.string().trim().min(1, 'Nama lengkap wajib diisi').max(150, 'Nama maksimal 150 karakter'),
  role: z.enum(['admin_masjid', 'kasir_amil'], {
    errorMap: () => ({ message: 'Role tidak valid' }),
  }),
})

export default function UserManagementModal({ open, onOpenChange }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users')
      return response.data
    },
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post('/users', values)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'User Berhasil Dibuat',
        description: 'User baru berhasil ditambahkan.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Membuat User',
        description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const response = await api.patch(`/users/${id}/status`, { is_active })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: variables.is_active ? 'User Diaktifkan' : 'User Dinonaktifkan',
        description: variables.is_active
          ? 'User dapat login kembali.'
          : 'User tidak dapat login.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Mengubah Status',
        description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      await api.delete(`/users/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'User Berhasil Dihapus',
        description: 'User berhasil dihapus dari sistem.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Menghapus User',
        description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            Manajemen User
          </DialogTitle>
          <DialogDescription>
            Tambahkan, kelola, atau hapus user admin dan kasir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Create User Form */}
          <CreateUserForm onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />

          {/* Users List */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Daftar User</h4>
            {isLoading ? (
              <p className="text-sm text-slate-500">Memuat...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada user.</p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Username</TableHead>
                      <TableHead className="font-semibold">Nama</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="w-[180px] font-semibold text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className={!u.is_active ? 'bg-slate-50' : ''}>
                        <TableCell className="font-medium text-slate-900">{u.username}</TableCell>
                        <TableCell className="text-slate-600">{u.full_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              u.role === 'admin_masjid'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }
                          >
                            {u.role === 'admin_masjid' ? 'Admin' : 'Kasir'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }
                          >
                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* Toggle Status Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMutation.mutate({ id: u.id, is_active: !u.is_active })}
                              disabled={toggleMutation.isPending}
                              className={`h-8 px-2 ${
                                u.is_active
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={u.is_active ? 'Nonaktifkan user' : 'Aktifkan user'}
                            >
                              {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Hapus user "${u.username}"? Ini tidak dapat dibatalkan.`)) {
                                  deleteMutation.mutate(u.id)
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-slate-200">
              Tutup
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateUserForm({ onSubmit, isLoading }) {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      full_name: '',
      role: 'kasir_amil',
    },
  })

  const onFormSubmit = (values) => {
    onSubmit(values)
    reset()
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Tambah User Baru
      </h4>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Contoh: admin2"
              {...register('username')}
              className="bg-white border-slate-200"
            />
            {errors.username && (
              <p className="text-xs text-red-600">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
                {...register('password')}
                className="bg-white border-slate-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input
              id="full_name"
              placeholder="Contoh: Ahmad Fauzi"
              {...register('full_name')}
              className="bg-white border-slate-200"
            />
            {errors.full_name && (
              <p className="text-xs text-red-600">{errors.full_name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              {...register('role')}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="kasir_amil">Kasir Amil</option>
              <option value="admin_masjid">Admin Masjid</option>
            </select>
            {errors.role && (
              <p className="text-xs text-red-600">{errors.role.message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {isLoading ? 'Menyimpan...' : 'Tambah User'}
          </Button>
        </div>
      </form>
    </div>
  )
}
