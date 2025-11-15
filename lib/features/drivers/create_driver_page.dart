import 'package:flutter/material.dart';

class CreateDriverPage extends StatelessWidget {
  const CreateDriverPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Driver')),
      body: Form(
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: const Padding(
          padding: EdgeInsets.all(16),
          child: Text('Driver form'),
        ),
      ),
    );
  }
}

