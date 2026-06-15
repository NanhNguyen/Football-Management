-- Tạo bảng user_roles để quản lý phân quyền
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE, 
    email TEXT,
    role TEXT CHECK (role IN ('admin', 'ref', 'user')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Cho phép admin đọc tất cả, user tự đọc của mình
CREATE POLICY "Users can read own role" 
    ON public.user_roles 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admin can do all" 
    ON public.user_roles 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Hàm tự động tạo role cho user mới khi họ đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger chạy hàm khi có user mới
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert role cho user hiện tại (ví dụ bạn là admin)
-- Hãy thay email admin của bạn vào đây sau khi chạy script này:
-- INSERT INTO public.user_roles (user_id, email, role)
-- SELECT id, email, 'admin' FROM auth.users WHERE email = 'YOUR_ADMIN_EMAIL@domain.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
