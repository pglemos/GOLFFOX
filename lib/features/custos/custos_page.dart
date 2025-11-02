// ========================================
// GolfFox Custos Page v11.0 - Clear Theme
// Pagina de controle de custos
// ========================================

import 'package:flutter/material.dart';
import '../../core/theme/gf_tokens.dart';

class CustosPage extends StatelessWidget {
  const CustosPage({super.key});

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
              'Custos',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: Color(GfTokens.colorOnSurface),
              ),
            ),
            const SizedBox(height: GfTokens.space2),
            const Text(
              'Controle de custos e analise financeira',
              style: TextStyle(
                fontSize: 16,
                color: Color(GfTokens.colorOnSurfaceVariant),
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
                        Icons.attach_money_outlined,
                        size: 64,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                      SizedBox(height: GfTokens.space4),
                      Text(
                        'Controle de Custos',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Color(GfTokens.colorOnSurface),
                        ),
                      ),
                      SizedBox(height: GfTokens.space2),
                      Text(
                        'Analise financeira e controle de custos operacionais',
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(GfTokens.colorOnSurfaceVariant),
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
