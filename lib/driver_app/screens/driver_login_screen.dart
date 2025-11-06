import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_service.dart';

class DriverLoginScreen extends StatefulWidget {
  const DriverLoginScreen({super.key});

  @override
  State<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends State<DriverLoginScreen> {
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
          .select('id, email, is_active')
          .eq('login_cpf', cpf)
          .eq('is_active', true)
          .maybeSingle();

      if (employee == null) {
        throw Exception('CPF ou senha inválidos');
      }

      // Tenta autenticar via Supabase Auth usando o e-mail do funcionário
      final email = (employee['email'] as String?)?.trim();
      if (email == null || email.isEmpty) {
        throw Exception('Conta sem e-mail vinculado. Contate o suporte.');
      }

      final authService = AuthService();
      final user = await authService.signInWithEmail(
        context,
        email,
        _passwordController.text,
      );

      if (user == null) {
        throw Exception('Falha ao autenticar. Verifique suas credenciais.');
      }

      // Navegar para dashboard do motorista
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/driver/dashboard');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
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
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.drive_eta, size: 80, color: Colors.blue),
                const SizedBox(height: 32),
                const Text(
                  'App do Motorista',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 48),
                TextFormField(
                  controller: _cpfController,
                  decoration: const InputDecoration(
                    labelText: 'CPF',
                    hintText: '000.000.000-00',
                    prefixIcon: Icon(Icons.person),
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Digite seu CPF';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: 'Senha',
                    prefixIcon: Icon(Icons.lock),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Digite sua senha';
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

