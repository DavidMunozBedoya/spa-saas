-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Spas
CREATE TABLE IF NOT EXISTS spas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    description TEXT,
    opening_hours JSONB,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Usuarios de la plataforma (Super admins)
CREATE TABLE IF NOT EXISTS platform_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Roles de staff
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name)
VALUES ('Propietario'), ('Administrador'), ('Terapeuta'), ('Recepcionista')
ON CONFLICT (name) DO NOTHING;

-- Staff del Spa
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spa_id UUID NOT NULL REFERENCES spas(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    identification_number VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(150),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (spa_id, identification_number),
    UNIQUE (email)
);

-- Usuarios del Spa (Login de staff)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spa_id UUID NOT NULL REFERENCES spas(id) ON DELETE CASCADE,
    full_name VARCHAR(150),
    email VARCHAR(150) NOT NULL,
    password_hash TEXT NOT NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (email)
);

-- Roles de Usuarios (Muchos a Muchos)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spa_id UUID NOT NULL REFERENCES spas(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    identity_number VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(150),
    birth_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (spa_id, identity_number)
);

-- Servicios
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spa_id UUID NOT NULL REFERENCES spas(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citas/Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spa_id UUID NOT NULL REFERENCES spas(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'BOOKED' CHECK (status IN ('BOOKED','COMPLETED','CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- Servicios en citas (Muchos a Muchos)
CREATE TABLE IF NOT EXISTS appointment_services (
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (appointment_id, service_id)
);

-- Recuperación de contraseñas
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform_user_id UUID REFERENCES platform_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK ((user_id IS NOT NULL AND platform_user_id IS NULL) OR (user_id IS NULL AND platform_user_id IS NOT NULL))
);

-- Facturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spa_id UUID NOT NULL REFERENCES spas(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    tax NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos por Rol
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Permisos dinámicos por usuario (Least Privilege Overrides)
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    spa_id UUID REFERENCES spas(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, permission_id)
);

-- Seed de Permisos
INSERT INTO permissions (code, description) VALUES
('users:manage', 'Gestionar usuarios y permisos del Spa'),
('appointments:create', 'Crear nuevas citas'),
('appointments:view', 'Ver calendario y detalles de citas'),
('appointments:edit', 'Modificar estado o detalles de citas'),
('services:manage', 'Crear, editar o eliminar servicios'),
('services:view', 'Ver lista de servicios'),
('invoices:view', 'Ver facturas generadas'),
('invoices:manage', 'Liquidar citas y emitir facturas'),
('reports:view', 'Acceder a reportes de ventas y desempeño'),
('clients:view', 'Ver base de datos de clientes'),
('clients:manage', 'Crear y editar fichas de clientes'),
('staff:view', 'Ver lista de personal del Spa'),
('staff:manage', 'Gestionar personal (crear/editar)'),
('spa:config', 'Configurar perfil del Spa (Logo, Redes, Horarios)'),
('platform:manage', 'Administración global de la plataforma (SuperAdmin)')
ON CONFLICT (code) DO NOTHING;

-- Propietario / Administrador: Todo menos SuperAdmin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name IN ('Propietario', 'Administrador') AND p.code != 'platform:manage'
ON CONFLICT DO NOTHING;

-- Recepcionista 
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Recepcionista' AND p.code IN (
  'appointments:create', 'appointments:view', 'appointments:edit',
  'services:view', 'invoices:view', 'invoices:manage',
  'clients:view', 'clients:manage', 'staff:view', 'spa:config', 'reports:view'
) ON CONFLICT DO NOTHING;

-- Terapeuta
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Terapeuta' AND p.code IN (
  'appointments:view', 'appointments:edit', 'services:view', 'clients:view'
) ON CONFLICT DO NOTHING;
