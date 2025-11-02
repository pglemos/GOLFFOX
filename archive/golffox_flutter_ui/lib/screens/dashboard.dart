import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 1180;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 4 KPIs da sua tela antiga
          Wrap(
            spacing: 18,
            runSpacing: 18,
            children: const [
              _KpiCard(
                title: 'Colaboradores em transito',
                value: '65',
                subtitle: '+12% vs ontem',
                icon: Icons.groups_rounded,
                chipColor: Color(0xFFD1FAE5),
                chipTextColor: Color(0xFF047857),
              ),
              _KpiCard(
                title: 'Veiculos ativos',
                value: '4/5',
                subtitle: 'Operacao normal',
                icon: Icons.directions_bus_filled_rounded,
                chipColor: Color(0xFFD1FAE5),
                chipTextColor: Color(0xFF047857),
              ),
              _KpiCard(
                title: 'Rotas do dia',
                value: '4',
                subtitle: '+3 vs planejado',
                icon: Icons.alt_route_rounded,
                chipColor: Color(0xFFFDE68A),
                chipTextColor: Color(0xFF92400E),
              ),
              _KpiCard(
                title: 'Alertas criticos',
                value: '1',
                subtitle: 'Requer atencao',
                icon: Icons.warning_amber_rounded,
                chipColor: Color(0xFFFEE2E2),
                chipTextColor: Color(0xFFB91C1C),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (isWide)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Expanded(flex: 3, child: _OcupacaoPorHorario()),
                SizedBox(width: 18),
                Expanded(flex: 2, child: _AcoesRapidas()),
              ],
            )
          else ...const [
            _OcupacaoPorHorario(),
            SizedBox(height: 18),
            _AcoesRapidas(),
          ],

          const SizedBox(height: 18),
          const _AlertBanner(),
          const SizedBox(height: 18),
          const _InsightsIA(),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color chipColor;
  final Color chipTextColor;
  const _KpiCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.chipColor,
    required this.chipTextColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 248,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: const Color(0xFFE55600)),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
            Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                decoration: BoxDecoration(
                  color: chipColor,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(subtitle, style: TextStyle(fontSize: 10, color: chipTextColor)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OcupacaoPorHorario extends StatelessWidget {
  const _OcupacaoPorHorario();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 260,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Ocupacao por horario', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 4),
          const Text('Relatorio simulado - conecte ao Supabase para tempo real.',
              style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 16),
          Expanded(
            child: CustomPaint(
              painter: _SimpleLinePainter(),
              child: Container(),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('06h', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11)),
              Text('08h', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11)),
              Text('10h', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11)),
              Text('12h', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11)),
              Text('14h', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11)),
              Text('16h', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11)),
              Text('18h', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}

class _AcoesRapidas extends StatelessWidget {
  const _AcoesRapidas();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: const [
        Text('Acoes rapidas', style: TextStyle(fontWeight: FontWeight.w600)),
        SizedBox(height: 12),
        _ActionCard(
          title: 'Rastrear veiculos',
          subtitle: 'Acompanhe localizacao em tempo real',
          icon: Icons.navigation_rounded,
          accent: Color(0xFF3B82F6),
        ),
        SizedBox(height: 10),
        _ActionCard(
          title: 'Ver analises',
          subtitle: 'Metricas e relatorios detalhados',
          icon: Icons.analytics_rounded,
          accent: Color(0xFFF97316),
        ),
        SizedBox(height: 10),
        _ActionCard(
          title: 'Configuracoes',
          subtitle: 'Preferencias e personalizacoes',
          icon: Icons.settings_rounded,
          accent: Color(0xFF6B7280),
        ),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color accent;
  const _ActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 90,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          const SizedBox(width: 14),
          Container(
            height: 42,
            width: 42,
            decoration: BoxDecoration(
              color: accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: accent),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF)),
          const SizedBox(width: 14),
        ],
      ),
    );
  }
}

class _AlertBanner extends StatelessWidget {
  const _AlertBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: Color(0xFFB91C1C)),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              '1 alerta(s) precisam de atencao imediata!',
              style: TextStyle(color: Color(0xFF991B1B), fontWeight: FontWeight.w500),
            ),
          ),
          Text('Ver alertas', style: TextStyle(color: Color(0xFFB91C1C), decoration: TextDecoration.underline)),
        ],
      ),
    );
  }
}

class _InsightsIA extends StatelessWidget {
  const _InsightsIA();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Insights da IA', style: TextStyle(fontWeight: FontWeight.w600)),
          SizedBox(height: 4),
          Text('Relatorio simulado: ocupacao semanal +8%.', style: TextStyle(color: Color(0xFF6B7280))),
        ],
      ),
    );
  }
}

class _SimpleLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()
      ..color = const Color(0xFFE5E7EB)
      ..strokeWidth = 1;
    // linhas horizontais leves
    for (int i = 0; i <= 4; i++) {
      final dy = size.height / 4 * i;
      canvas.drawLine(Offset(0, dy), Offset(size.width, dy), grid);
    }

    final paint = Paint()
      ..color = const Color(0xFF3B82F6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.3
      ..strokeCap = StrokeCap.round;

    final path = Path();
    path.moveTo(0, size.height * .6);
    path.cubicTo(size.width * .2, size.height * .4, size.width * .35, size.height * .3,
        size.width * .5, size.height * .35);
    path.cubicTo(size.width * .65, size.height * .45, size.width * .75, size.height * .35,
        size.width, size.height * .3);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}



