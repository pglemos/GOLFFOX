import 'package:flutter/material.dart';

import '../../core/i18n/i18n.dart';
import '../../core/routing/app_router.dart';
import '../../core/routing/app_routes.dart';
import '../../core/services/snackbar_service.dart';
import '../../services/supabase_service.dart';

class PassengerLoginScreen extends StatefulWidget {
  const PassengerLoginScreen({super.key});

  @override
  State<PassengerLoginScreen> createState() => _PassengerLoginScreenState();
}

class _PassengerLoginScreenState extends State<PassengerLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _cpfController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final cpf = _cpfController.text.replaceAll(RegExp(r'[^\d]'), '');
      
      // Buscar funcionário por CPF
      final employee = await SupabaseService.instance.client
          .from('gf_employee_company')
          .select()
          .eq('login_cpf', cpf)
          .eq('is_active', true)
          .maybeSingle();

      if (employee == null) {
        throw Exception('CPF ou senha inválidos');
      }

      // Validar senha
      final passwordHash =
          employee['password_hash'] as String? ?? '';
      if (passwordHash != _passwordController.text) {
        throw Exception('CPF ou senha inválidos');
      }

      // Navegar para dashboard do passageiro via AppRouter
      if (mounted) {
        AppRouter.instance.go(AppRoutes.passengerHome);
      }
    } on Exception catch (error) {
      if (mounted) {
        SnackBarService.error(
          context,
          error,
          fallbackKey: 'passenger.login.error',
          params: {'message': error.toString()},
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.person, size: 80, color: Colors.green),
                const SizedBox(height: 32),
                Text(
                  I18n.t(context, 'passenger.app.title'),
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 48),
                TextFormField(
                  controller: _cpfController,
                  decoration: InputDecoration(
                    labelText: I18n.t(context, 'common.cpf'),
                    hintText: I18n.t(context, 'common.cpf.hint'),
                    prefixIcon: const Icon(Icons.person),
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return I18n.t(context, 'validation.required.cpf');
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  decoration: InputDecoration(
                    labelText: I18n.t(context, 'common.password'),
                    prefixIcon: const Icon(Icons.lock),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return I18n.t(context, 'validation.required.password');
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _handleLogin,
                    child: _loading
                        ? const CircularProgressIndicator()
                        : const Text('Entrar'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

  @override
  void dispose() {
    _cpfController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}

