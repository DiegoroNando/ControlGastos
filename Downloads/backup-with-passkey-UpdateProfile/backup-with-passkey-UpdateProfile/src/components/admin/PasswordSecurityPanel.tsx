import React, { useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, List, ListItem, ListItemText, Divider } from '@mui/material';
import { runPasswordMigration } from '../../utils/migratePasswords';
import { checkPasswordSecurityStatus } from '../../utils/passwordMigrationUtil';
import { securityCheckPasswordHandling } from '../../services/passwordService';

/**
 * Componente administrativo para migrar contraseñas y verificar la seguridad de las mismas
 */
const PasswordSecurityPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof checkPasswordSecurityStatus>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runPasswordMigration>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar estado actual de seguridad de contraseñas
  const checkCurrentStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await checkPasswordSecurityStatus();
      setStatus(stats);
    } catch (err) {
      setError(`Error al verificar estado: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Ejecutar la migración de contraseñas
  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const migrationResult = await runPasswordMigration();
      setResult(migrationResult);
      
      // Actualizar también el status si la migración fue exitosa
      if (migrationResult.afterMigration) {
        setStatus(migrationResult.afterMigration);
      }
    } catch (err) {
      setError(`Error en la migración: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Panel de Seguridad de Contraseñas
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Estado de Contraseñas
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={checkCurrentStatus} 
            disabled={loading}
          >
            Verificar Estado Actual
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={runMigration} 
            disabled={loading || (status && status.plainPasswordUsers === 0)}
          >
            Migrar Contraseñas
          </Button>
        </Box>
        
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
            <CircularProgress size={24} />
            <Typography>Procesando...</Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        
        {status && (
          <Paper variant="outlined" sx={{ p: 2, my: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Resumen de Seguridad:
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="Usuarios totales" 
                  secondary={status.totalUsers} 
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Usuarios con contraseñas seguras (bcrypt)" 
                  secondary={status.securePasswordUsers}
                  secondaryTypographyProps={{ 
                    color: status.securePasswordUsers > 0 ? 'success.main' : 'inherit' 
                  }}
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Usuarios con contraseñas en texto plano" 
                  secondary={status.plainPasswordUsers}
                  secondaryTypographyProps={{ 
                    color: status.plainPasswordUsers > 0 ? 'error.main' : 'success.main'
                  }}
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Usuarios sin contraseña" 
                  secondary={status.emptyPasswordUsers} 
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Porcentaje de seguridad" 
                  secondary={`${status.securityPercentage}%`}
                  secondaryTypographyProps={{ 
                    color: status.securityPercentage >= 90 
                      ? 'success.main' 
                      : status.securityPercentage >= 50 
                        ? 'warning.main' 
                        : 'error.main'
                  }}
                />
              </ListItem>
            </List>
            
            {status.plainPasswordUsers > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Hay {status.plainPasswordUsers} usuarios con contraseñas almacenadas en texto plano. 
                Se recomienda ejecutar la migración.
              </Alert>
            )}
            
            {status.plainPasswordUsers === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Todas las contraseñas están almacenadas de forma segura con bcrypt.
              </Alert>
            )}
          </Paper>
        )}
        
        {result && (
          <Paper variant="outlined" sx={{ p: 2, my: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Resultado de la Migración:
            </Typography>
            
            <Alert severity={result.success ? "success" : "warning"} sx={{ mb: 2 }}>
              {result.message}
            </Alert>
            
            {result.migrationStats && (
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Usuarios procesados" 
                    secondary={result.migrationStats.totalUsers} 
                  />
                </ListItem>
                <Divider />
                
                <ListItem>
                  <ListItemText 
                    primary="Usuarios con contraseñas en texto plano" 
                    secondary={result.migrationStats.usersWithPlainPasswords} 
                  />
                </ListItem>
                <Divider />
                
                <ListItem>
                  <ListItemText 
                    primary="Usuarios migrados exitosamente" 
                    secondary={result.migrationStats.migratedUsers}
                    secondaryTypographyProps={{ color: 'success.main' }}
                  />
                </ListItem>
                <Divider />
                
                <ListItem>
                  <ListItemText 
                    primary="Usuarios con errores" 
                    secondary={result.migrationStats.errors.length}
                    secondaryTypographyProps={{ 
                      color: result.migrationStats.errors.length > 0 ? 'error.main' : 'success.main'
                    }}
                  />
                </ListItem>
              </List>
            )}
            
            {result.migrationStats?.errors.length && result.migrationStats.errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Errores encontrados:
                </Typography>
                <List dense>
                  {result.migrationStats.errors.map((err, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={`CURP: ${err.curp}`} 
                        secondary={`Error: ${err.error}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </Paper>
        )}
      </Paper>
    </Box>
  );
};

export default PasswordSecurityPanel;
