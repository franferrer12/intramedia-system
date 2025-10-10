-- Migration V014: Rehash passwords with BCrypt cost=4 for better performance
-- Date: 2025-10-10
-- Purpose: Reduce login latency from 1.3s to <100ms by using lower BCrypt cost factor

-- Regenerar password del admin con BCrypt cost=4
-- Password: admin123 (mismo password, nuevo hash más rápido)
-- BCrypt hash con cost=4 (generado con htpasswd -nbBC 4)
-- Hash: $2y$04$gj602DDev6dFCqXcURHydOeJ1lt0tnB4OUlZveQuSAGy56xOrgCBe

UPDATE usuarios
SET password = '$2y$04$gj602DDev6dFCqXcURHydOeJ1lt0tnB4OUlZveQuSAGy56xOrgCBe'
WHERE username = 'admin';

-- IMPORTANTE: Esto mejora el performance de login de 1.3s a ~80-100ms
-- El password sigue siendo 'admin123' pero el hash es mucho más rápido de verificar
-- BCrypt cost 10 (viejo) → cost 4 (nuevo) = 64x menos iteraciones = 64x más rápido
