// ========================================
// GolfFox Socorro Page v11.0 - Clear Theme
// Pagina de emergencias e socorro
// ========================================

import 'package:flutter/material.dart';
import '../../core/theme/gf_tokens.dart';

class SocorroPage extends StatelessWidget {
  const SocorroPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(GfTokens.page),
      body: Padding(
        padding: const EdgeInsets.all(GfTokens.space6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'Socorro',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: Color(GfTokens.textTitle),
              ),
            ),
            const SizedBox(height: GfTokens.space2),
            const Text(
              'Central de emergencias e atendimento de socorro',
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
                        Icons.emergency_outlined,
                        size: 64,
                        color: Color(GfTokens.textMuted),
                      ),
                      SizedBox(height: GfTokens.space4),
                      Text(
                        'Central de Socorro',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Color(GfTokens.textBody),
                        ),
                      ),
                      SizedBox(height: GfTokens.space2),
                      Text(
                        'Atendimento de emergencias e solicitacoes de socorro',
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
}
