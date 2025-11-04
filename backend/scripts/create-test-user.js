import authService from '../src/services/authService.js';
import pool from '../src/config/database.js';

/**
 * Script para crear usuarios de prueba
 * Ejecutar: node scripts/create-test-user.js
 */

const createTestUsers = async () => {
  try {
    console.log('🚀 Creando usuarios de prueba...\n');

    // 1. Crear Agencia
    console.log('📝 Creando agencia de prueba...');
    const agencyResult = await authService.register({
      email: 'agencia@test.com',
      password: 'test1234',
      userType: 'agency',
      additionalData: {
        agencyName: 'Agencia Musical Test',
        legalName: 'Agencia Musical Test S.L.',
        taxId: 'B12345678',
        contactPerson: 'Juan Pérez',
        phone: '+34 600 123 456'
      }
    });

    if (agencyResult.success) {
      console.log('✅ Agencia creada exitosamente!');
      console.log(`   Email: agencia@test.com`);
      console.log(`   Contraseña: test1234`);
      console.log(`   Token: ${agencyResult.token.substring(0, 20)}...\n`);
    } else {
      if (agencyResult.error && agencyResult.error.includes('ya está registrado')) {
        console.log('ℹ️  La agencia ya existe en la base de datos\n');
      } else {
        console.log('❌ Error creando agencia:', agencyResult.error, '\n');
      }
    }

    // 2. Crear DJ Individual
    console.log('📝 Creando DJ individual de prueba...');
    const djResult = await authService.register({
      email: 'dj@test.com',
      password: 'test1234',
      userType: 'individual_dj',
      additionalData: {
        nombre: 'DJ Test',
        telefono: '+34 600 999 999',
        instagram_user: 'djtest'
      }
    });

    if (djResult.success) {
      console.log('✅ DJ Individual creado exitosamente!');
      console.log(`   Email: dj@test.com`);
      console.log(`   Contraseña: test1234`);
      console.log(`   Token: ${djResult.token.substring(0, 20)}...\n`);
    } else {
      if (djResult.error && djResult.error.includes('ya está registrado')) {
        console.log('ℹ️  El DJ ya existe en la base de datos\n');
      } else {
        console.log('❌ Error creando DJ:', djResult.error, '\n');
      }
    }

    // 3. Mostrar resumen
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RESUMEN DE USUARIOS DE PRUEBA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🏢 AGENCIA:');
    console.log('   Email: agencia@test.com');
    console.log('   Contraseña: test1234');
    console.log('   Dashboard: http://localhost:5174/\n');

    console.log('🎧 DJ INDIVIDUAL:');
    console.log('   Email: dj@test.com');
    console.log('   Contraseña: test1234');
    console.log('   Dashboard: http://localhost:5174/\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ Usuarios creados! Ahora puedes hacer login en http://localhost:5174/login');

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  } finally {
    // Cerrar conexión a la base de datos
    await pool.end();
    process.exit(0);
  }
};

// Ejecutar
createTestUsers();
