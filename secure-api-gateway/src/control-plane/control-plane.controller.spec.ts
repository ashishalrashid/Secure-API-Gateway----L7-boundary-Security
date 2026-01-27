import { Test, TestingModule } from '@nestjs/testing';
import { ControlPlaneController } from './control-plane.controller';

describe('ControlPlaneController', () => {
  let controller: ControlPlaneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControlPlaneController],
    }).compile();

    controller = module.get<ControlPlaneController>(ControlPlaneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
