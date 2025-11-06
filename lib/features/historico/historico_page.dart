// ========================================
// GolfFox Historico Page v11.0 - Clear Theme
// Pagina de historico de viagens
// ========================================

import 'package:flutter/material.dart';
import '../../core/theme/gf_tokens.dart';

class HistoricoPage extends StatelessWidget {
  const HistoricoPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: const Color(GfTokens.page),
      body: Padding(
        padding: const EdgeInsets.all(GfTokens.space6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'Historico',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: Color(GfTokens.textTitle),
              ),
            ),
            const SizedBox(height: GfTokens.space2),
            const Text(
              'Historico de viagens e operacoes',
              style: TextStyle(
                fontSize: 16,
                color: Color(GfTokens.textMuted),
              ),
            ),

            const SizedBox(height: GfTokens.space6),

            // Content placeholder
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(GfTokens.surface),
                  borderRadius: BorderRadius.circular(GfTokens.radius),
                  border: Border.all(color: const Color(GfTokens.stroke)),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.history_outlined,
                        size: 64,
                        color: Color(GfTokens.textMuted),
                      ),
                      SizedBox(height: GfTokens.space4),
                      Text(
                        'Historico de Viagens',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Color(GfTokens.textBody),
                        ),
                      ),
                      SizedBox(height: GfTokens.space2),
                      Text(
                        'Consulta ao historico de viagens e operacoes',
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(GfTokens.textMuted),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
}
