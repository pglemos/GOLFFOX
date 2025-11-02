import 'package:flutter/material.dart';

class MotoristasScreen extends StatelessWidget {
  const MotoristasScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Gestao de Motoristas',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          const Text(
            'Conteudo em construcao - conecte com seus dados do Supabase.',
          ),
          const SizedBox(height: 24),
          Expanded(
            child: Center(
              child: OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add),
                label: const Text('Criar novo'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

